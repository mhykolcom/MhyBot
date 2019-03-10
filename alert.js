(function () {
  
var _gsScope="undefined"!=typeof module&&module.exports&&"undefined"!=typeof global?global:this||window;(_gsScope._gsQueue||(_gsScope._gsQueue=[])).push(function(){"use strict";function a(a,b,c,d,e,f){return c=(parseFloat(c||0)-parseFloat(a||0))*e,d=(parseFloat(d||0)-parseFloat(b||0))*f,Math.sqrt(c*c+d*d)}function b(a){return"string"!=typeof a&&a.nodeType||(a=_gsScope.TweenLite.selector(a),a.length&&(a=a[0])),a}function c(a,b,c){var d,e,f=a.indexOf(" ");return-1===f?(d=void 0!==c?c+"":a,e=a):(d=a.substr(0,f),e=a.substr(f+1)),d=-1!==d.indexOf("%")?parseFloat(d)/100*b:parseFloat(d),e=-1!==e.indexOf("%")?parseFloat(e)/100*b:parseFloat(e),d>e?[e,d]:[d,e]}function d(c){if(!c)return 0;c=b(c);var d,e,f,g,h,j,k,l=c.tagName.toLowerCase(),m=1,n=1;"non-scaling-stroke"===c.getAttribute("vector-effect")&&(n=c.getScreenCTM(),m=n.a,n=n.d);try{e=c.getBBox()}catch(o){console.log("Error: Some browsers like Firefox won't report measurements of invisible elements (like display:none).")}if(e&&(e.width||e.height)||"rect"!==l&&"circle"!==l&&"ellipse"!==l||(e={width:parseFloat(c.getAttribute("rect"===l?"width":"circle"===l?"r":"rx")),height:parseFloat(c.getAttribute("rect"===l?"height":"circle"===l?"r":"ry"))},"rect"!==l&&(e.width*=2,e.height*=2)),"path"===l)g=c.style.strokeDasharray,c.style.strokeDasharray="none",d=c.getTotalLength()||0,m!==n&&console.log("Warning: <path> length cannot be measured accurately when vector-effect is non-scaling-stroke and the element isn't proportionally scaled."),d*=(m+n)/2,c.style.strokeDasharray=g;else if("rect"===l)d=2*e.width*m+2*e.height*n;else if("line"===l)d=a(e.x,e.y,e.x+e.width,e.y+e.height,m,n);else if("polyline"===l||"polygon"===l)for(f=c.getAttribute("points").match(i)||[],"polygon"===l&&f.push(f[0],f[1]),d=0,h=2;h<f.length;h+=2)d+=a(f[h-2],f[h-1],f[h],f[h+1],m,n)||0;else("circle"===l||"ellipse"===l)&&(j=e.width/2*m,k=e.height/2*n,d=Math.PI*(3*(j+k)-Math.sqrt((3*j+k)*(j+3*k))));return d||0}function e(a,c){if(!a)return[0,0];a=b(a),c=c||d(a)+1;var e=h(a),f=e.strokeDasharray||"",g=parseFloat(e.strokeDashoffset),i=f.indexOf(",");return 0>i&&(i=f.indexOf(" ")),f=0>i?c:parseFloat(f.substr(0,i))||1e-5,f>c&&(f=c),[Math.max(0,-g),Math.max(0,f-g)]}var f,g=_gsScope.document,h=g.defaultView?g.defaultView.getComputedStyle:function(){},i=/(?:(-|-=|\+=)?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/gi,j=-1!==((_gsScope.navigator||{}).userAgent||"").indexOf("Edge");f=_gsScope._gsDefine.plugin({propName:"drawSVG",API:2,version:"0.1.6",global:!0,overwriteProps:["drawSVG"],init:function(a,b,f,g){if(!a.getBBox)return!1;var i,k,l,m,n=d(a)+1;return this._style=a.style,"function"==typeof b&&(b=b(g,a)),b===!0||"true"===b?b="0 100%":b?-1===(b+"").indexOf(" ")&&(b="0 "+b):b="0 0",i=e(a,n),k=c(b,n,i[0]),this._length=n+10,0===i[0]&&0===k[0]?(l=Math.max(1e-5,k[1]-n),this._dash=n+l,this._offset=n-i[1]+l,this._addTween(this,"_offset",this._offset,n-k[1]+l,"drawSVG")):(this._dash=i[1]-i[0]||1e-6,this._offset=-i[0],this._addTween(this,"_dash",this._dash,k[1]-k[0]||1e-5,"drawSVG"),this._addTween(this,"_offset",this._offset,-k[0],"drawSVG")),j&&(m=h(a),m.strokeLinecap!==m.strokeLinejoin&&(k=parseFloat(m.strokeMiterlimit),this._addTween(a.style,"strokeMiterlimit",k,k+1e-4,"strokeMiterlimit"))),!0},set:function(a){this._firstPT&&(this._super.setRatio.call(this,a),this._style.strokeDashoffset=this._offset,1===a||0===a?this._style.strokeDasharray=this._offset<.001&&this._length-this._dash<=10?"none":this._offset===this._dash?"0px, 999999px":this._dash+"px,"+this._length+"px":this._style.strokeDasharray=this._dash+"px,"+this._length+"px")}}),f.getLength=d,f.getPosition=e}),_gsScope._gsDefine&&_gsScope._gsQueue.pop()(),function(a){"use strict";var b=function(){return(_gsScope.GreenSockGlobals||_gsScope)[a]};"undefined"!=typeof module&&module.exports?(require("../TweenLite.min.js"),module.exports=b()):"function"==typeof define&&define.amd&&define(["TweenLite"],b)}("DrawSVGPlugin");
  
var clone = {clone}, 
    addTilt = {addTilt},
    addBlur = true,
    username = "{topText}",
    tag = "{botText}",
    delayTime = {delayTime}; 
 
function loadScript (url) {
  return new Promise(function (resolve, reject) {
    const script = document.createElement('script')
    script.onload = resolve
    script.onerror = reject

    script.src = url

    document.head.appendChild(script)
  })
}
  
loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/1.20.3/TweenMax.min.js').then(function () { 
  animate();
});

var animate = function() {

/* Check text widths ============================*/
  
var nameWidth = $(".hiddenName span").width();
var tagWidth = $(".hiddenTag span").width();
  
if(nameWidth <= 640){
  $(".name").width(nameWidth);
} else {
  var resizeScale = 640/nameWidth;
  $(".nameWrapper").css( "transform", "scale(" + resizeScale + ")" );
}
if(tagWidth <= 506){
  $(".tag").width(tagWidth);
} else {
  var resizeScale = 506/tagWidth;
  $(".tagWrapper").css( "transform", "scale(" + resizeScale + ")" );
}
  
/* Check for features ============================*/
if(addTilt){
  $( "#alertHolder, #frontHolder, #backHolder" ).addClass("tilt");
}
if(addBlur){
  $( "#backHolder" ).addClass("blur");
}

/* Clone after all other setup ============================*/
if(clone){
  $( "#frontHolder .inner" ).clone().appendTo( "#backHolder" );
}
  
/* Looping Animations ============================*/
TweenMax.from(".innerCircle", 4, {ease: Power0.easeNone, rotation: -360, repeat: -1, transformOrigin: "center center"});
TweenMax.set(".lines", {scale: .8, transformOrigin: "center center"});  

function spin(){
  var spinAmount = randomBetween(0, 360);
  TweenMax.to(".lines", 4, {onComplete: spin, ease: Power3.easeInOut, rotation: spinAmount, transformOrigin: "center center"}); 
} 
spin();
   
TweenMax.staggerFrom("#frontHolder .squares rect", .8, {opacity:0, repeat: 2}, .1);
TweenMax.staggerFrom("#frontHolder .plusses g", 1, {delay: 1, opacity:0, yoyo: true, repeat: -1}, 1.2);
TweenMax.staggerFrom("#backHolder .squares rect", .8, {opacity:0, repeat: 2}, .1);
TweenMax.staggerFrom("#backHolder .plusses g", 1, {delay: 1, opacity:0, yoyo: true, repeat: -1}, 1.2);
  
/* Play Audio ==============================*/

function playAudio(){
  tl.pause();
  var soundFile = '{soundFile}';
 
  if (soundFile !== 'null') {
  	var audio = new Audio('{soundFile}');
	  audio.volume = {soundVolume} * .01;
	  
	  audio.oncanplay = function() {
	    audio.play();
	    tl.play();
	  }
  } else {
  	tl.play();
  }
} 

/* Helper Functions ==============================*/
  
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
} 

var tl = new TimelineMax(); 
 
  tl.to("body", .1, {opacity: 1, delay: .1})
    .from("#alertHolder", 1, {onStart: playAudio, delay: .1, opacity: 0, ease:RoughEase.ease.config({points:50, strength:2, clamp:true})}, "-=.1") 
  
    // animations 
    .from(".dottedLine", 1, {delay: 1, scaleX: .4, opacity: 0, transformOrigin: "left center"}) 
    .from(".nameBg", .6, {width: 0, onStart: loadName}, "-=1") 
    .from(".tagBg", .6, {scaleX: 0, transformOrigin: "right center", onComplete: loadTag}, "-=.6")
    .from(".alertHolder", 0, {delay: delayTime, onComplete: animateOut})
  ; 

} // end of animate

function animateOut(){
  TweenMax.to("#alertHolder", 1, {delay: .1, opacity: 0, ease:RoughEase.ease.config({points:50, strength:2, clamp:true})}); 
}
  
function loadName(){
  displayLetterWriteString({
    targetElement: document.querySelectorAll('#alertHolder .name'),
    finalString: [username],
    repeat: 1,
    holdTimeRepeat: 3000,
    changesPerLetter: 5,
    changesBeforeNextLetter: 2,
    timePerChange: 1000 / 30
  })
}
  
function loadTag(){
  displayLetterWriteString({
    targetElement: document.querySelectorAll('#alertHolder .tag'),
    finalString: [tag],
    repeat: 1,
    holdTimeRepeat: 3000,
    changesPerLetter: 5,
    changesBeforeNextLetter: 2,
    timePerChange: 1000 / 30
  })
}

const generateRandomString = (() => {
  function generateCharset (range) {
    const chars = []
    for (let i = range[0]; i < range[1] + 1; i++) {
      chars.push(String.fromCharCode(i))
    }
    return chars
  }
  const alphaChars = generateCharset([65, 90])
  const numChars = generateCharset([48, 57])

  const charMap = {
    'A': alphaChars,
    '#': numChars
  }

  return function (pattern) {
    const str = []
    if (!pattern) return ''
    for (let i = 0; i < pattern.length; i++) {
      if (!charMap[pattern[i]]) {
        str.push(pattern[i])
        continue
      }

      const charset = charMap[pattern[i]]

      const index = Math.floor(Math.random() * charset.length)
      str.push(charset[index])
    }

    return str.join('')
  }
})()

const sleep = ms => new Promise(wake => setTimeout(wake, ms))

async function displayLetterWriteString (args) {
  const {
    targetElement: _targetElement, finalString, changesPerLetter, changesBeforeNextLetter, timePerChange, holdTimeRepeat, holdTimeNextString, repeat
  } = args

  const targetElement = (_targetElement instanceof NodeList)
    ? [].slice.call(_targetElement) : _targetElement

  function isElementInDom (element) {
    if (!element || !document.body.contains(element)) {
      return false
    }
    return true
  }

  if (Array.isArray(targetElement)) {
    for (const element of targetElement) {
      if (!isElementInDom(element)) {
        return
      }
    }
  } else {
    if (!isElementInDom(targetElement)) {
      return
    }
  }

  if (Number.isInteger(repeat) && repeat !== 0) {
    for (let i = 0; repeat === -1 || i < repeat; i++) {
      const success = await displayLetterWriteString({
        ...args,
        repeat: null
      })

      if (repeat === -1 || i < repeat - 1) {
        await sleep(holdTimeRepeat)
      }

      if (success === false) {
        return
      }
    }

    return
  }

  if (Array.isArray(finalString)) {
    for (const strIndex in finalString) {
      const str = finalString[strIndex]
      await displayLetterWriteString({
        ...args,
        finalString: str
      })

      if (strIndex < finalString.length - 1) {
        await sleep(holdTimeNextString)
      }
    }

    return
  }

  const isNumberRegex = /[0-9]/
  const isAlphaRegex = /[a-zA-Z]/
  const isWhitespaceRegex = /\s/

  function setText (text) {
    function setElement (element) {
      if (!element) {
        return
      }
      element.innerText = text
    }

    if (Array.isArray(targetElement)) {
      targetElement.forEach(setElement)
    } else {
      setElement(targetElement)
    }
  }

  setText('')

  function getCharType (char) {
    if (isNumberRegex.test(char)) {
      return '#'
    }

    if (isAlphaRegex.test(char)) {
      return 'A'
    }

    return char
  }

  let outputStringArray = []

  function updateText () {
    setText(outputStringArray.join(''))
  }

  async function doChar ({ finalChar, originalIndex }, charIndex) {
    await sleep(changesBeforeNextLetter * charIndex * timePerChange)

    for (let iteration = 1; iteration <= changesPerLetter; iteration++) {
      const isFinal = iteration === changesPerLetter
      const displayChar = isFinal ? finalChar : generateRandomString(getCharType(finalChar))

      outputStringArray[originalIndex] = displayChar
      updateText()

      await sleep(timePerChange)
    }
  }

  for (let i = 0; i < finalString.length; i++) {
    if (isWhitespaceRegex.test(finalString[i])) {
      outputStringArray[i] = finalString[i]
    }
  }

  await Promise.all(
    finalString
      .split('')
      .map((char, index) => ({ finalChar: char, originalIndex: index }))
      .filter(char => !isWhitespaceRegex.test(char.finalChar)) 
      .map(doChar)
  )
}

displayLetterWriteString({
  targetElement: document.querySelectorAll('.rightBar'),
  finalString: ['KERED\nTTS.X-1\n4.15.-4'],
  repeat: 1,
  holdTimeRepeat: 3000, 
  changesPerLetter: 3,
  changesBeforeNextLetter: 1,
  timePerChange: 1000 / 15
})

 
}());  // end of function wrapper







(function () {
  
    var _gsScope="undefined"!=typeof module&&module.exports&&"undefined"!=typeof global?global:this||window;(_gsScope._gsQueue||(_gsScope._gsQueue=[])).push(function(){"use strict";function a(a,b,c,d,e,f){return c=(parseFloat(c||0)-parseFloat(a||0))*e,d=(parseFloat(d||0)-parseFloat(b||0))*f,Math.sqrt(c*c+d*d)}function b(a){return"string"!=typeof a&&a.nodeType||(a=_gsScope.TweenLite.selector(a),a.length&&(a=a[0])),a}function c(a,b,c){var d,e,f=a.indexOf(" ");return-1===f?(d=void 0!==c?c+"":a,e=a):(d=a.substr(0,f),e=a.substr(f+1)),d=-1!==d.indexOf("%")?parseFloat(d)/100*b:parseFloat(d),e=-1!==e.indexOf("%")?parseFloat(e)/100*b:parseFloat(e),d>e?[e,d]:[d,e]}function d(c){if(!c)return 0;c=b(c);var d,e,f,g,h,j,k,l=c.tagName.toLowerCase(),m=1,n=1;"non-scaling-stroke"===c.getAttribute("vector-effect")&&(n=c.getScreenCTM(),m=n.a,n=n.d);try{e=c.getBBox()}catch(o){console.log("Error: Some browsers like Firefox won't report measurements of invisible elements (like display:none).")}if(e&&(e.width||e.height)||"rect"!==l&&"circle"!==l&&"ellipse"!==l||(e={width:parseFloat(c.getAttribute("rect"===l?"width":"circle"===l?"r":"rx")),height:parseFloat(c.getAttribute("rect"===l?"height":"circle"===l?"r":"ry"))},"rect"!==l&&(e.width*=2,e.height*=2)),"path"===l)g=c.style.strokeDasharray,c.style.strokeDasharray="none",d=c.getTotalLength()||0,m!==n&&console.log("Warning: <path> length cannot be measured accurately when vector-effect is non-scaling-stroke and the element isn't proportionally scaled."),d*=(m+n)/2,c.style.strokeDasharray=g;else if("rect"===l)d=2*e.width*m+2*e.height*n;else if("line"===l)d=a(e.x,e.y,e.x+e.width,e.y+e.height,m,n);else if("polyline"===l||"polygon"===l)for(f=c.getAttribute("points").match(i)||[],"polygon"===l&&f.push(f[0],f[1]),d=0,h=2;h<f.length;h+=2)d+=a(f[h-2],f[h-1],f[h],f[h+1],m,n)||0;else("circle"===l||"ellipse"===l)&&(j=e.width/2*m,k=e.height/2*n,d=Math.PI*(3*(j+k)-Math.sqrt((3*j+k)*(j+3*k))));return d||0}function e(a,c){if(!a)return[0,0];a=b(a),c=c||d(a)+1;var e=h(a),f=e.strokeDasharray||"",g=parseFloat(e.strokeDashoffset),i=f.indexOf(",");return 0>i&&(i=f.indexOf(" ")),f=0>i?c:parseFloat(f.substr(0,i))||1e-5,f>c&&(f=c),[Math.max(0,-g),Math.max(0,f-g)]}var f,g=_gsScope.document,h=g.defaultView?g.defaultView.getComputedStyle:function(){},i=/(?:(-|-=|\+=)?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/gi,j=-1!==((_gsScope.navigator||{}).userAgent||"").indexOf("Edge");f=_gsScope._gsDefine.plugin({propName:"drawSVG",API:2,version:"0.1.6",global:!0,overwriteProps:["drawSVG"],init:function(a,b,f,g){if(!a.getBBox)return!1;var i,k,l,m,n=d(a)+1;return this._style=a.style,"function"==typeof b&&(b=b(g,a)),b===!0||"true"===b?b="0 100%":b?-1===(b+"").indexOf(" ")&&(b="0 "+b):b="0 0",i=e(a,n),k=c(b,n,i[0]),this._length=n+10,0===i[0]&&0===k[0]?(l=Math.max(1e-5,k[1]-n),this._dash=n+l,this._offset=n-i[1]+l,this._addTween(this,"_offset",this._offset,n-k[1]+l,"drawSVG")):(this._dash=i[1]-i[0]||1e-6,this._offset=-i[0],this._addTween(this,"_dash",this._dash,k[1]-k[0]||1e-5,"drawSVG"),this._addTween(this,"_offset",this._offset,-k[0],"drawSVG")),j&&(m=h(a),m.strokeLinecap!==m.strokeLinejoin&&(k=parseFloat(m.strokeMiterlimit),this._addTween(a.style,"strokeMiterlimit",k,k+1e-4,"strokeMiterlimit"))),!0},set:function(a){this._firstPT&&(this._super.setRatio.call(this,a),this._style.strokeDashoffset=this._offset,1===a||0===a?this._style.strokeDasharray=this._offset<.001&&this._length-this._dash<=10?"none":this._offset===this._dash?"0px, 999999px":this._dash+"px,"+this._length+"px":this._style.strokeDasharray=this._dash+"px,"+this._length+"px")}}),f.getLength=d,f.getPosition=e}),_gsScope._gsDefine&&_gsScope._gsQueue.pop()(),function(a){"use strict";var b=function(){return(_gsScope.GreenSockGlobals||_gsScope)[a]};"undefined"!=typeof module&&module.exports?(require("../TweenLite.min.js"),module.exports=b()):"function"==typeof define&&define.amd&&define(["TweenLite"],b)}("DrawSVGPlugin");
      
    var clone = {clone}, 
        addTilt = {addTilt},
        addBlur = true,
        username = "{topText}",
        tag = "{botText}",
        amount = "{typeText}", 
        delayTime = {delayTime}; 
     
    function loadScript (url) {
      return new Promise(function (resolve, reject) {
        const script = document.createElement('script')
        script.onload = resolve
        script.onerror = reject
    
        script.src = url
    
        document.head.appendChild(script)
      })
    }
      
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/1.20.3/TweenMax.min.js').then(function () { 
      animate();
    });
    
    var animate = function() {
    
    /* Check text widths ============================*/
      
    var nameWidth = $(".hiddenName span").width();
    var tagWidth = $(".hiddenTag span").width();
      
    if(nameWidth <= 640){
      $(".name").width(nameWidth);
    } else {
      var resizeScale = 640/nameWidth;
      $(".nameWrapper").css( "transform", "scale(" + resizeScale + ")" );
    }
    if(tagWidth <= 266){
      $(".tag").width(tagWidth);
    } else {
      var resizeScale = 266/tagWidth;
      $(".tagWrapper").css( "transform", "scale(" + resizeScale + ")" );
    }
      
    /* Check for features ============================*/
    if(addTilt){
      $( "#alertHolder, #frontHolder, #backHolder" ).addClass("tilt");
    }
    if(addBlur){
      $( "#backHolder" ).addClass("blur");
    }
    
    /* Clone after all other setup ============================*/
    if(clone){
      $( "#frontHolder .inner" ).clone().appendTo( "#backHolder" );
    }
      
    /* Looping Animations ============================*/
    TweenMax.to(".blueBox", 10, {x: 100, ease: Power0.easeNone, repeat: -1, yoyo:true});  
    
    TweenMax.staggerFrom("#frontHolder .topShapes rect", 1, {opacity:0, repeat: -1}, 1.1); 
    TweenMax.staggerFrom("#backHolder .topShapes rect", 1, {opacity:0, repeat: -1}, 1.1);
      
    TweenMax.from(".squares, .randomText", 2, {opacity: 0, repeat: -1, yoyo:true}); 
    
    /* Play Audio ==============================*/
    
    function playAudio(){
      tl.pause();
      var soundFile = '{soundFile}';
     
      if (soundFile !== 'null') {
          var audio = new Audio('{soundFile}');
          audio.volume = {soundVolume} * .01;
          
          audio.oncanplay = function() {
            audio.play();
            tl.play();
          }
      } else {
          tl.play();
      }
    } 
     
    /* Helper Functions ==============================*/
      
    function randomBetween(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    } 
    
    var tl = new TimelineMax(); 
      
      tl.set(".introCircle", {scaleX: -1, transformOrigin: "center center"});
      
      tl.to("body", .1, {opacity: 1, delay: .1})
        .from("#alertHolder", 1, {onStart: playAudio, delay: .1, opacity: 0, ease:RoughEase.ease.config({points:50, strength:2, clamp:true})}, "-=.1")
      
        // animations 
    
        .from(".nameBg", .6, {delay: .6, width: 0, onStart: loadName}, "-=.8") 
        .from(".tagBg", .6, {scaleX: 0, transformOrigin: "right center", onComplete: loadTag}, "-=.2")
        .from(".leftBorder", .6, {x: 40, opacity: 0}, "-=.6")
        .from(".rightBorder", .6, {x: -40, opacity: 0}, "-=.6")
        .fromTo(".exes", .6, {drawSVG:"100% 100%"}, {drawSVG:"100% 0%"}, "-=.3")
        .from(".dottedLine", .3, {y: 10, opacity: 0}, "-=.4")
        .from(".amount", .3, {y: 10, opacity: 0, onStart: loadAmount}, "-=.4")
        .from(".alertHolder", 0, {delay: delayTime, onComplete: animateOut}) 
      ; 
    
    } // end of animate
    
    function animateOut(){
      TweenMax.to("#alertHolder", 1, {delay: .1, opacity: 0, ease:RoughEase.ease.config({points:50, strength:2, clamp:true})}); 
    }
      
    function loadName(){
      displayLetterWriteString({
        targetElement: document.querySelectorAll('#alertHolder .name'),
        finalString: [username],
        repeat: 1,
        holdTimeRepeat: 3000,
        changesPerLetter: 5,
        changesBeforeNextLetter: 2,
        timePerChange: 1000 / 30
      })
    }
      
    function loadTag(){
      displayLetterWriteString({
        targetElement: document.querySelectorAll('#alertHolder .tag'),
        finalString: [tag],
        repeat: 1,
        holdTimeRepeat: 3000,
        changesPerLetter: 5,
        changesBeforeNextLetter: 2,
        timePerChange: 1000 / 30
      })
    }
      
    function loadAmount(){
      displayLetterWriteString({
        targetElement: document.querySelectorAll('#alertHolder .amount'),
        finalString: [amount],
        repeat: 1,
        holdTimeRepeat: 3000,
        changesPerLetter: 5,
        changesBeforeNextLetter: 2,
        timePerChange: 1000 / 30
      })
    }
    
    const generateRandomString = (() => {
      function generateCharset (range) {
        const chars = []
        for (let i = range[0]; i < range[1] + 1; i++) {
          chars.push(String.fromCharCode(i))
        }
        return chars
      }
      const alphaChars = generateCharset([65, 90])
      const numChars = generateCharset([48, 57])
    
      const charMap = {
        'A': alphaChars,
        '#': numChars
      }
    
      return function (pattern) {
        const str = []
        if (!pattern) return ''
        for (let i = 0; i < pattern.length; i++) {
          if (!charMap[pattern[i]]) {
            str.push(pattern[i])
            continue
          }
    
          const charset = charMap[pattern[i]]
    
          const index = Math.floor(Math.random() * charset.length)
          str.push(charset[index])
        }
    
        return str.join('')
      }
    })()
    
    const sleep = ms => new Promise(wake => setTimeout(wake, ms))
    
    async function displayLetterWriteString (args) {
      const {
        targetElement: _targetElement, finalString, changesPerLetter, changesBeforeNextLetter, timePerChange, holdTimeRepeat, holdTimeNextString, repeat
      } = args
    
      const targetElement = (_targetElement instanceof NodeList)
        ? [].slice.call(_targetElement) : _targetElement
    
      function isElementInDom (element) {
        if (!element || !document.body.contains(element)) {
          return false
        }
        return true
      }
    
      if (Array.isArray(targetElement)) {
        for (const element of targetElement) {
          if (!isElementInDom(element)) {
            return
          }
        }
      } else {
        if (!isElementInDom(targetElement)) {
          return
        }
      }
    
      if (Number.isInteger(repeat) && repeat !== 0) {
        for (let i = 0; repeat === -1 || i < repeat; i++) {
          const success = await displayLetterWriteString(Object.assign({}, args, {
            repeat: null
          }))
    
          if (repeat === -1 || i < repeat - 1) {
            await sleep(holdTimeRepeat)
          }
    
          if (success === false) {
            return
          }
        }
    
        return
      }
    
      if (Array.isArray(finalString)) {
        for (const strIndex in finalString) {
          const str = finalString[strIndex]
          
          await displayLetterWriteString(Object.assign({}, args, {
            finalString: str
          }))
    
          if (strIndex < finalString.length - 1) {
            await sleep(holdTimeNextString)
          }
        }
    
        return
      }
    
      const isNumberRegex = /[0-9]/
      const isAlphaRegex = /[a-zA-Z]/
      const isWhitespaceRegex = /\s/
    
      function setText (text) {
        function setElement (element) {
          if (!element) {
            return
          }
          element.innerText = text
        }
    
        if (Array.isArray(targetElement)) {
          targetElement.forEach(setElement)
        } else {
          setElement(targetElement)
        }
      }
    
      setText('')
    
      function getCharType (char) {
        if (isNumberRegex.test(char)) {
          return '#'
        }
    
        if (isAlphaRegex.test(char)) {
          return 'A'
        }
    
        return char
      }
    
      let outputStringArray = []
    
      function updateText () {
        setText(outputStringArray.join(''))
      }
    
      async function doChar ({ finalChar, originalIndex }, charIndex) {
        await sleep(changesBeforeNextLetter * charIndex * timePerChange)
    
        for (let iteration = 1; iteration <= changesPerLetter; iteration++) {
          const isFinal = iteration === changesPerLetter
          const displayChar = isFinal ? finalChar : generateRandomString(getCharType(finalChar))
    
          outputStringArray[originalIndex] = displayChar
          updateText()
    
          await sleep(timePerChange)
        }
      }
    
      for (let i = 0; i < finalString.length; i++) {
        if (isWhitespaceRegex.test(finalString[i])) {
          outputStringArray[i] = finalString[i]
        }
      }
    
      await Promise.all(
        finalString
          .split('')
          .map((char, index) => ({ finalChar: char, originalIndex: index }))
          .filter(char => !isWhitespaceRegex.test(char.finalChar)) 
          .map(doChar)
      ) 
    }
    
    displayLetterWriteString({
      targetElement: document.querySelectorAll('.leftBar'), 
      finalString: ['KYL.RU7Z\nGTSTD-12.42.34\nPL5-H4L'], 
      repeat: 1,
      holdTimeRepeat: 3000, 
      changesPerLetter: 3,
      changesBeforeNextLetter: 1,
      timePerChange: 1000 / 15
    })
    
     
    }());  // end of function wrapper