//Date Util .js is encapsulated as a unified function of the date format
Date.prototype.format = function (style) {
    let o = {
        "M+": this.getMonth() + 1, //month
        "d+": this.getDate(),      //day
        "h+": this.getHours(),     //hour
        "m+": this.getMinutes(),   //minute
        "s+": this.getSeconds(),   //second
        "S": this.getMilliseconds() //millisecond
    };
    if (/(y+)/.test(style)) {
        style = style.replace(RegExp.$1,
            (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (let k in o) {
        if (new RegExp("(" + k + ")").test(style)) {
            style = style.replace(RegExp.$1,
                RegExp.$1.length === 1 ? o[k] :
                    ("00" + o[k]).substr(("" + o[k]).length));
        }
    }
    return style;
};
