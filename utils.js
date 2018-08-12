exports.fancyTimeFormat = (time) => {
    // Hours, minutes and seconds
    var hrs = ~~(time / 3600);
    var mins = ~~((time % 3600) / 60);
    var secs = time % 60;

    var ret = "";

    if (hrs > 1) {
        ret += "" + hrs + " hours"
        if (mins > 1) ret += ", "
    } else if (hrs == 1) {
        ret += "" + hrs + " hour"
        if (mins > 1) ret += ", "
    }

    if (mins > 1) {
        ret += "" + mins + " minutes"
    } else if (mins == 1) {
        ret += "" + mins + " minute"
    }

    if (hrs == 0 && mins == 0) {
        ret = "Just now"
    }
    return ret;
}