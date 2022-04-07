function init(config) {


    var canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 950;
    document.querySelector('main').appendChild(canvas);


    config = config || [];
    config.userName = config.userName || "james_mtc";
    config.backgroundImageURL = config.backgroundImageURL || 'https://jamesvillarrubia.github.io/vigilant-goggles/docs/assets/empty_bg_devto.png';
    config.quoteText = config.quoteText || "Standard Text if you don't select anything";
    config.articleURL = config.articleURL || "";
    config.fontSize = config.fontSize || 46;
    config.fontFamily = config.fontFamily || "'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, Courier, monospace";
    config.color = config.color || "#cccccc";
    config.lineHeightAdjust = config.lineHeightAdjust || 1.2;
    config.lineHeight = config.lineHeight || config.fontSize * config.lineHeightAdjust;
    config.url = config.url || "https://twitter.com/intent/tweet?url=";
    config.textX = config.textX || 240;
    config.textY = config.textY || 340;
    config.textMaxWidth = config.textMaxWidth || 1040;
    config.textMaxHeight = config.textMaxHeight || 370;
    config.textMaxCharCount = config.textMaxCharCount || 320;
    config.canvasIdentifier = config.canvasIdentifier || "canvas";
    config.canvas = document.querySelector(config.canvasIdentifier);
    config.ctx = config.canvas.getContext('2d');
    config.width = config.width || config.canvas.width;
    config.height = config.height || config.canvas.height;
    config.adjustFontSize = config.adjustFontSize || false;
    config.textAreaName = 'article_body_markdown';
    config.textArea = document.querySelector('#' + config.textAreaName);
    config.grabCurrentURL = config.grabCurrentURL || true;
    return config;
}

alert('running');
var c = init();

var image = new Image();
make_bg();

function make_bg()
{
    var selectedText = getSelectedText();
    if (selectedText.length > 0) {
        c.quoteText = selectedText;
    }

    var charCount = c.quoteText.length + c.articleURL.length + c.userName.length + 10;
    if (charCount > c.textMaxCharCount) {
        alert("max character count exceeded by " + (charCount - c.textMaxCharCount) + " characters");
        return;
    }

    c.ctx.save();
    c.ctx.clearRect(0, 0, c.width, c.height);
    base_image = new Image();
    base_image.crossOrigin = '*';
    base_image.src = c.backgroundImageURL;
    base_image.onload = function () {
        console.log("drawing");
        c.ctx.drawImage(base_image, 0, 0, c.width, c.height);
        draw();
    }
}

function calcFontSize(quoteText) {

    if (quoteText.length < 100) {
        return c.fontSize * 1.5;
    }
    if (quoteText.length < 200) {
        return c.fontSize * 1.25;
    }
    return c.fontSize;

}

function draw() {

    if (c.adjustFontSize) {
        c.fontSize = calcFontSize(c.quoteText);
        c.lineHeight = c.fontSize * c.lineHeightAdjust;
    }

    if (c.grabCurrentURL) {
        c.articleURL = window.location.href.replace("/edit", "");
    }

    c.ctx.font = c.fontSize + 'px ' + c.fontFamily;
    var lines = getLines(c.ctx, c.quoteText, c.textMaxWidth);
    c.linesHeightTotal = lines.length * c.lineHeight;
    c.ctx.fillStyle = c.color;
    c.ctx.textAlign = "start";
    c.ctx.font = c.fontSize + 'px ' + c.fontFamily;
    var y = c.textY + (c.textMaxHeight / 2) - (c.linesHeightTotal / 2);

    for (a = 0; a < lines.length; a++) {
        c.ctx.fillText(lines[a], c.textX, y);
        y += c.lineHeight;
    }

    c.ctx.restore();

    image.crossOrigin = '*';
    c.canvas.toBlob(function (img) {
        image = img;
        uploadImage();
    }, 'image/jpg');


    document.body.appendChild(c.canvas)

}

function getLines(ctx, text, maxWidth) {
    if(text.split("<br/>").length > 1){
        lines = text.split("<br/>")
        return lines;
    }
    var words = text.split(" ");
    var lines = [];
    var currentLine = words[0];

    for (var i = 1; i < words.length; i++) {
        var word = words[i];
        var width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

function getSelectedText() {

    var start = c.textArea.selectionStart;
    var finish = c.textArea.selectionEnd;  
    return c.textArea.value.substring(start, finish);

}

function copyToClipboard(str) {

    var el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

}

function uploadImage() {

    let auth_token = window.csrfToken;
    let formData = new FormData();
    formData.append("image", image, "myImage.jpg");
    formData.append("authenticity_token", auth_token);

    fetch('https://dev.to/image_uploads', {method: 'POST', body: formData})
            .then(function (response) {
                return response.json();
            })
            .then(function (json) {
                if (json.length !== 0) {

                    c.url = c.url + c.articleURL;
                    c.url = c.url + "&text=";
                    c.url = c.url + encodeURI(c.quoteText)

                    var markdown = "[![Click to Tweet: " + c.quoteText + "](" + json.links[0] + ")](" + c.url + ")";

                    copyToClipboard(markdown);

                    alert("copied to clipboard");

                }
            })
            .catch(function (err) {
                alert("something went wrong!");
                console.log("error", err);
            });

};