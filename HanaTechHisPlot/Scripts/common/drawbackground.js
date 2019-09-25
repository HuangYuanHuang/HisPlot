

var leftoffProportion = 0.0648967551622419; //canvas 画框至左边距
var canvasheigthProportion = 0.7238805970149254; //画布占高度比例
var huabutopsz = 0.0309278350515464;
var huabusz = 0.9257731958762887;

var huabuleftsz;
var huabutopsz;
var huabuwidth;
var huabuheight;

//构造画线类
var canvasBuffer; //缓存cavans,1级缓存
var canvasBufferContext;
var colorarray = new Array(); //画线的颜色数组
var hasinit = false;
//时间
var AminDate;
var AmaxDate; 
//初始化画布大小，建立缓存画布，
function InitCanvas() {
    if (hasinit) {
        return;
    }
    var canvas = document.getElementById('drawCanvas');
    canvas.style.cursor = "move";
    var x = document.documentElement.clientWidth;
    var y = document.documentElement.clientHeight;
    canvas.width = x - 17;
    var canvasheight1 = y * canvasheigthProportion;
    canvas.height = canvasheight1+10;
    var allwidth=x-10;
    canvas.style.marginLeft = "0px";
    canvas.style.marginTop = "0px";
    huabuleftsz = x * leftoffProportion;
    huabuwidth = allwidth - huabuleftsz * 2;

    huabutopsz = canvasheight1 * huabutopsz;
    huabuheight = canvasheight1 * huabusz;
    colorarray.push("#FF0000");
    colorarray.push("#00FFFF");
    colorarray.push("#0000FF");

    canvasBuffer = document.createElement('canvas');
    canvasBuffer.width = canvas.width;
    canvasBuffer.height = canvas.height;
    canvasBufferContext = canvasBuffer.getContext('2d');
    canvas.addEventListener("mousedown", mouserdownfunct);
    canvas.addEventListener("mousemove", mousemovefunct);
    canvas.addEventListener("mouseup", mouseupfunct);
    hasinit=true;
//    $(document).bind('contextmenu', function () {
//        return false;
    //    });
    //右击事件
    $("#drawCanvas").contextMenu('myMenu2', {
        //菜单样式
        menuStyle: {
            border: '2px solid #000'
        },
        //菜单项样式
        itemStyle: {
            fontFamily: 'verdana',
            backgroundColor: 'white',
            color: '#000000',
            border: 'none',
            padding: '1px'

        },
        //菜单项鼠标放在上面样式
        itemHoverStyle: {
            color: 'blue',
            backgroundColor: 'red',
            border: 'none'
        },
        //事件    
        bindings:
          {
              'item_1': function (t) {
                  //alert('Trigger was ' + t.id + '\nAction was item_1');
                  postdrawbig();
              }
          }
    });
}



function xcheck(xpr) {
    if (xpr < huabuleftsz) {
        return huabuleftsz;
    }
    else if (xpr > (huabuleftsz + huabuwidth)) {
        return huabuleftsz + huabuwidth;
    }
    else {
        return xpr;
    }
}
var setpostarea=false;
var startx;
var tmpstartx;//最终结果
var endx;//最终结果
function mouserdownfunct(ev) {
    if (ev.button == 0) {
        setpostarea = true;
        startx = ev.clientX;
        startx = xcheck(startx);
    }
    else {

    }
}
function mousemovefunct(ev) {
    if (setpostarea == true) {
        var canvas = document.getElementById('drawCanvas');
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width,canvas.height);
        ctx.drawImage(canvasBuffer, 0, 0);
        endx = ev.clientX;
        endx = xcheck(endx);
        tmpstartx = startx;
        var k;
        if (endx < tmpstartx) {
            k = endx;
            endx = tmpstartx;
            tmpstartx = k;
        }
        ctx.save();
        ctx.globalAlpha =0.2;
        ctx.fillStyle = "#000000";
        ctx.fillRect(tmpstartx, huabutopsz, (endx - tmpstartx), huabuheight);
        ctx.restore();

    }
}
function mouseupfunct(ev) {
    if (ev.button == 0) {
        setpostarea = false;
    }
}
function drawhuabu() {
//    var canvas = document.getElementById('drawCanvas');
    //    var ctx = canvas.getContext('2d');
    canvasBufferContext.save();
    canvasBufferContext.translate(0.5, 0.5);
    canvasBufferContext.rect(huabuleftsz, huabutopsz, huabuwidth, huabuheight);
    canvasBufferContext.fillStyle = "#FEFEFE";
    canvasBufferContext.fill();
    //  ctx.globalAlpha = 0.2;
    canvasBufferContext.lineWidth = 1;
    canvasBufferContext.strokeStyle = "#6F6F6F";
    canvasBufferContext.strokeRect(huabuleftsz, huabutopsz, huabuwidth, huabuheight);
    canvasBufferContext.stroke();
    //画纵网格线
    var everyxsz=huabuwidth/12;
    for (var s1 = 1; s1 <= 11; s1++) {
        canvasBufferContext.beginPath();
        if (s1 % 3 == 0) {
            canvasBufferContext.strokeStyle = "#AAAAAA";
        }
        else {
            canvasBufferContext.strokeStyle = "#E0E0E0";
        }
        canvasBufferContext.moveTo(parseInt(huabuleftsz + everyxsz * s1), parseInt(huabutopsz));
        canvasBufferContext.lineTo(parseInt(huabuleftsz + everyxsz * s1), parseInt(huabutopsz + huabuheight));
        canvasBufferContext.stroke();
    }
    //画横网格线
    var everyysz = huabuheight / 8;
    for (var s2 = 1; s2 <= 7; s2++) {
        canvasBufferContext.beginPath();
        if (s2 % 2 == 0) {
            canvasBufferContext.strokeStyle = "#AAAAAA";
        }
        else {
            canvasBufferContext.strokeStyle = "#E0E0E0";
        }
        canvasBufferContext.moveTo(parseInt(huabuleftsz), parseInt(huabutopsz + everyysz * s2));
        canvasBufferContext.lineTo(parseInt(huabuleftsz + huabuwidth), parseInt(huabutopsz + everyysz * s2));
        canvasBufferContext.stroke();
    }
    canvasBufferContext.restore();
}

function postdrawbig() {

    var pianyix = tmpstartx - huabuleftsz;
    var timespan = (AmaxDate.getTime() - AminDate.getTime()) * pianyix / huabuwidth;
    var time1 = new Date();
    time1.setTime(AminDate.getTime() + timespan);
    pianyix = endx - huabuleftsz;
    timespan = (AmaxDate.getTime() - AminDate.getTime()) * pianyix / huabuwidth;
    var time2 = new Date();
    time2.setTime(AminDate.getTime() + timespan);
    AminDate = time1;
    AmaxDate = time2;
    redrawc();
}

function drawxtime() {
    canvasBufferContext.save();
    canvasBufferContext.fillStyle = "blue";
    canvasBufferContext.font = "13px Arial";
    canvasBufferContext.textAlign = "center";
    canvasBufferContext.textBaseline = "top";
    var everyx = (AmaxDate.getTime() - AminDate.getTime()) / 4;
    var everyxzuobiao = (huabuwidth) / 4;
    for (var b = 0; b < 5; b++) {
        var fordate = new Date(AminDate.getTime() + (everyx * b));
        canvasBufferContext.fillText(DateString(fordate), huabuleftsz + (b * everyxzuobiao), huabutopsz + huabuheight + 8);
    }
    canvasBufferContext.restore();
}

function DateString(date) {
    var restr = date.getFullYear().toString();
    restr += "-";
    var mos = date.getMonth();mos += 1;
    restr += mos.toString();
    restr += "-";
    restr += date.getDay().toString();
    restr += " ";
    mos = date.getHours();
    if (mos < 10) {
        restr += "0";
    }
    restr += date.getHours().toString();
    restr += ":";
    mos = date.getMinutes();
    if (mos < 10) {
        restr += "0";
    }
    restr += date.getMinutes().toString();
    restr += ":";
    mos = date.getSeconds();
    if (mos < 10) {
        restr += "0";
    }
    restr += date.getSeconds().toString();
    return restr;
}

//构造数据类
function SingleData(Sdate, SValue) {
    this.Sdate = Sdate;
    this.SValue = SValue;
    this.SReliability = 0;
    this.FormatDate = "";

}



function drawSingleChat() {
    this.drawmax = 100;
    this.drawmin = 0;
    this.minDate = new Date(2016, 1, 09, 0, 0, 0);
    this.maxDate = new Date(2016, 1, 10, 0, 0, 0);
    this.allDataArray = new Array();
    this.OffsetTime = 6345000 - 6345000; //时间偏移参数
}

drawSingleChat.prototype = {
    constructor: drawSingleChat,

    OnPaintText: function () {
        canvasBufferContext.save();
        canvasBufferContext.fillStyle = "blue";
        canvasBufferContext.font = "15px Arial";
        canvasBufferContext.textAlign = "end";
        canvasBufferContext.textBaseline = "middle";
        var everyy = (this.drawmax - this.drawmin) / 4;
        var everyyzuobiao = (huabuheight) / 4;
        var zhi;
        for (var a = 0; a < 5; a++) {
            zhi = this.drawmax - (a * everyy);
            canvasBufferContext.fillText(zhi.toFixed(2).toString(), huabuleftsz, huabutopsz + (everyyzuobiao * a));
        }
        canvasBufferContext.restore();
        //   ctx.font = "10px Arial";
        //        canvasBufferContext.textAlign = "center";
        //        canvasBufferContext.textBaseline = "top";
        //        var everyx = (this.maxDate.getTime() - this.minDate.getTime()) / 4;
        //        var everyxzuobiao = (huabuwidth) / 4;
        //        for (var b = 0; b < 5; b++) {
        //            var fordate = new Date(this.minDate.getTime() + (everyx * b));
        //            canvasBufferContext.fillText(DateString(fordate), huabuleftsz + (b * everyxzuobiao), huabutopsz + huabuheight + 8);
        //        }

    },

    OnPaintChat: function (aindex) {
        canvasBufferContext.save();
        canvasBufferContext.lineWidth = 2;
        canvasBufferContext.strokeStyle = colorarray[aindex];
        canvasBufferContext.globalAlpha = 0.8;
        canvasBufferContext.beginPath();
        var maxhigt = this.drawmax - this.drawmin;
        var maxwith = this.maxDate.getTime() - this.minDate.getTime();
        var atx = this.allDataArray[0].Sdate.getTime() - this.minDate.getTime() + this.OffsetTime;
        var aty = this.drawmax - this.allDataArray[0].SValue;
        var pointx = huabuwidth * atx / maxwith + huabuleftsz;
        var pointy = huabuheight * aty / maxhigt + huabutopsz;

        canvasBufferContext.rect(huabuleftsz, huabutopsz, huabuwidth, huabuheight);
        canvasBufferContext.clip();
        canvasBufferContext.moveTo(pointx, pointy);
        for (var i = 1; i < this.allDataArray.length; i++) {
            atx = this.allDataArray[i].Sdate.getTime() - this.minDate.getTime() + this.OffsetTime;
            aty = this.drawmax - this.allDataArray[i].SValue;
            pointx = huabuwidth * atx / maxwith + huabuleftsz;
            pointy = huabuheight * aty / maxhigt + huabutopsz;
            canvasBufferContext.lineTo(pointx, pointy);
        }
        canvasBufferContext.stroke();
        canvasBufferContext.globalAlpha = 1;
        canvasBufferContext.restore();
        this.OnPaintText();
    },


    AddData: function (SingleData) {
        this.allDataArray.push(SingleData);
    }
}
var allorc = new Array();
OnPaintAll();

function OnPaintAll() {
    InitCanvas();
    drawhuabu();
    AminDate = new Date(2016, 1, 09, 0, 0, 0);
    AmaxDate = new Date(2016, 1, 10, 0, 0, 0);
    drawxtime();
    for(var k=0;k<2;k++){
        var pisdaw = new drawSingleChat();
        for (var a = 0; a < 24; a++) {
            var myDate = new Date(2016, 1, 09, a, 14, 15);
            var randat = Math.random() * 100;
            var SData = new SingleData(myDate, randat);
            pisdaw.AddData(SData);
        }
        allorc.push(pisdaw);
    }

    for(var s=0;s<allorc.length;s++){
        allorc[s].OnPaintChat(s);
    }
    // pisdaw.OnPaintChat();//双缓存输出，用于还原图像
            var canvas = document.getElementById('drawCanvas');
            var ctx = canvas.getContext('2d');
            ctx.drawImage(canvasBuffer, 0, 0);
}

function redrawc() {
    var canvas = document.getElementById('drawCanvas');
    var ctx = canvas.getContext('2d');
    canvasBufferContext.clearRect(0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawhuabu();
    drawxtime();
    for (var s = 0; s < allorc.length; s++) {
        allorc[s].OnPaintChat(s);
    }

    ctx.drawImage(canvasBuffer, 0, 0);
}
