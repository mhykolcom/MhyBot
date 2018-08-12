exports.print = (msg, err) => {
    var date = new Date();
    var h = leadingZero(date.getHours());
    var m = leadingZero(date.getMinutes());
    var s = leadingZero(date.getSeconds());

    console.log("[" + h + ":" + m + ":" + s + "]", msg);

    if (err)
        console.log(err);
}

exports.fancyTimeFormat = (time) => {
    // Hours, minutes and seconds
    var hrs = ~~(time / 3600);
    var mins = ~~((time % 3600) / 60);
    var secs = time % 60;

    // Output like "1:01" or "4:03:59" or "123:03:59"
    var ret = "";

    if (hrs > 1) {
        ret += "" + hrs + " hours, "
    } else if (hrs == 1) {
        ret += "" + hrs + " hour, "
    }

    if (mins > 1) {
        ret += "" + mins + " minutes"
    } else if (mins == 1) {
        ret += "" + mins + " minute"
    }

    if (hrs == 0 && mins == 0) {
        ret = "Just now"
    }
    // ret += "" + secs + " seconds";
    return ret;
}


function leadingZero(d) {
    if (d < 10) {
        return "0" + d;
    } else {
        return d;
    }
}
