function resizer()
{
    var media_query_  = window.matchMedia("(max-width: 319px)");
    var media_query_0 = window.matchMedia("(max-width: 481px)");
    var media_query_1 = window.matchMedia("(max-width: 641px)");
    var media_query_2 = window.matchMedia("(max-width: 941px)");
    var media_query_3 = window.matchMedia("(max-width: 1025px)");
    var media_query_4 = window.matchMedia("(max-width: 1281px)");





    if (media_query_.matches)
    {
        adjust_head_mobile();
        collapse_cards_mobile();
        adjust_about();
        console.log("[+] Adjusted");
    }

    if (media_query_0.matches)
    {
        adjust_head_mobile();
        collapse_cards_mobile();
        adjust_about();
        console.log("[+] Adjusted");
    }

    if (media_query_1.matches)
    {

    }

    if (media_query_2.matches)
    {

    }

    if (media_query_4.matches)
    {

    }


}


function adjust_head_mobile()
{
    var title_header = document.getElementById("titlehead");
    title_header.classList.add("text-center");

}



function collapse_cards_mobile()
{
    var element = document.getElementById("cardrow");
    element.classList.remove("row");
    element.classList.add("row-col-1");

}

function adjust_about()
{
    var element = document.getElementById("abtme");
    element.classList.remove("display-5");
    element.classList.add("display-7");

}



