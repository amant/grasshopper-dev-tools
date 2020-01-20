# Manifest file

# Content Script
<p>url: https://developer.chrome.com/extensions/content_scripts</p>

activeTab
- inject programmatically
- declaratively

example:
- ./content-script-basic
- ./content-script


# Popup

# Devtools

# Background


Useful links:
https://developer.chrome.com/extensions/getstarted
https://developer.chrome.com/extensions/samples#search:color

Tutorial Video:
https://www.youtube.com/watch?v=9Tl3OmwrSaM



I promise "You will feel very im-powered by the way you can control and manipulate web-applications".
"Feel like I enabled God mode in browser".



- Quick history of web-debugging
-- alert() and console.log() with firebug

- What chrome dev-tool provides and doesn't?
-- generic debugging

- Why own extension?
-- ability to represent dom abstraction and app/framework specific debugging
-- DEMO


- What are the options?
-- content script (fun little exercise)
-- pop-up (fun little exercise)
-- backgroud (fun little exercise)
-- panel-dev tools (fun little exercise)



-- home work and things to do in home
-- proxy for ajax
-- accessibility implementation





# manifest source to entry
# message passing vs evaluation

requirement
- git
- chrome browser
- information sharing, workshop and loads of fun
- smile


Agenda

- Why own extension?
- Grasshoppers Devtool intro.
- Building blocks of an extension.


Requirements
- Git
- Chrome browser



Why own extension ?

Unlocking God Mode in browser

After this session I promise you that you will be im-powered, and very much in control of web applications and browser.



Let's start by taking look at history of web debugging.
- alert('Hi');

It all changed with firebug(firefox) 
- console.log
- observe ajax calls
- debugger point
- support for extension



As web-application's became more useful, complexity increased in 
- DOM manipulation.
- Event handing.


Abstraction to handle complexity
- in DOM Nodes (custom-elements)
- Event handling to reactivity



- Dev Tools are stucked towards showing the basic primitive DOM structure, and events
- Here Element explorer tools full of noise when all you want is view hiearchy of your application. 


How a simple custom-element base application looks like.
example.html


- And here is how Grasshopper Devtool tries to show it.
