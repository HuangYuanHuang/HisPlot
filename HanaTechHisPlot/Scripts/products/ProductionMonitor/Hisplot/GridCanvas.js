﻿angular.module('canvasGrid', ['angularMoment', "QueryModule"]).factory("Canvas", function (moment, $http, QueryModel, $timeout, $interval, $location, $window) {
    var main = this;
    main.$table = $("#tableCanvas");
    var nodeData = function (time, value, min, max, confidence) {
        var self = this;
        self.time = time;
        self.value = value;
        self.confidence = confidence;
        self.min = min;
        self.max = max;
        self.path = function () {

            var X = (moment(time).diff(main.startDate, 'seconds', true) / main.offsetTime) * main.canvas.width;
            var Y = main.canvas.height - ((self.value - self.min) / (self.max - self.min)) * main.canvas.height;

            return { X: X, Y: Y };
        };

    };
    var lineNode = function (name, color, data, style, width, min, max) {
        var self = this;
        self.name = name;
        self.color = color;
        self.data = data || [];
        self.fixedLine = [];  //限值横线
        self.isDrawFixedLine = false;
        self.minValue = min;
        self.maxValue = max;
        self.display = true;
        self.axisYPosition = [];
        self.axisValue = [];
        self.style = style;
        self.width = width;
        self.addData = function (item) {
            self.data.push(item);
        };
        self.init = function (array) {
            for (var i = 0; i < array.length; i++) {
                self.data.push(new nodeData(array[i].Time, array[i].Value, self.minValue, self.maxValue, array[i].Confidence));

            }


        };
        self.rowLenght = [0, 0, 2, 2, 2, 0, 0, 0, 4];
        self.initYAxis = function (len, totalLen) {
            self.clearData();
            var index = len + 1; //line 索引
            var rows = self.rowLenght[main.canvas.tableRow.length];
            if (totalLen > 4 && main.canvas.height < 300) {
                rows = 1;
            }
            else if (totalLen > 3 && main.canvas.height < 300) {
                rows = 2;
            }

            var itemY = (self.maxValue - self.minValue) / rows;
            var itemHeight = main.canvas.height / rows;
            var itemIndex = 0;
            var tempX = $("tr", main.$table).offset().left - 80;
            var tempV = $("tr", main.$table).offset().left + main.$table.width() + 10;
            for (var i = rows - 1; i >= 0; i--) {
                var tempY = main.canvas.offsetTop + (i + 1) * itemHeight - index * main.canvas.labelHeight;

                self.axisYPosition.push(new position(tempX, tempY, itemIndex * itemY + self.minValue, self.color));
                itemIndex++;
            }
            var tempLastY = main.canvas.offsetTop + (totalLen - index) * main.canvas.labelHeight - 5;
            self.axisYPosition.push(new position(tempX, tempLastY, self.maxValue, self.color));
            if (self.data.length > 0) {
                if (totalLen == 1) {
                    var h = main.canvas.offsetTop + main.canvas.height / 2 - main.canvas.labelHeight;
                    self.axisValue.push(new position(tempV, h, self.data[self.data.length - 1].value, self.color));
                } else if (totalLen == 2) {
                    var h = main.canvas.offsetTop + index * (main.canvas.height / 3);
                    self.axisValue.push(new position(tempV, h, self.data[self.data.length - 1].value, self.color));
                } else {
                    var h = main.canvas.offsetTop + (index - 1) * (main.canvas.height / (totalLen - 1)) - main.canvas.labelHeight;
                    if (index == 1) {
                        h = main.canvas.offsetTop;
                    }

                    self.axisValue.push(new position(tempV, h, self.data[self.data.length - 1].value, self.color));
                }

            }

        };
        self.clearData = function () {
            while (self.axisYPosition.length > 0) {
                self.axisYPosition.pop();
            }
            while (self.axisValue.length > 0) {
                self.axisValue.pop();
            }
        };
        self.draw = function (index, total) {
            self.initYAxis(index, total);
            if (self.data.length > 0) {
                main.canvas.canvasContext.beginPath();
                main.canvas.canvasContext.strokeStyle = self.color;
                main.canvas.canvasContext.lineWidth = self.width;
                main.canvas.canvasContext.moveTo(self.data[0].path().X, self.data[0].path().Y);

                for (var i = 1; i < self.data.length; i++) {
                    main.canvas.canvasContext.lineTo(self.data[i].path().X, self.data[i].path().Y);

                }
                main.canvas.canvasContext.stroke();
                main.canvas.canvasContext.closePath();
                self.drawFixedLine();
            }
        };
        self.drawFixedLine = function () {
            if (self.isDrawFixedLine) {
                self.fixedLine.forEach(function (item, index) {
                    main.canvas.canvasContext.beginPath();
                    main.canvas.canvasContext.strokeStyle = "#f70800";
                    main.canvas.canvasContext.lineWidth = 2;
                    var Y = main.canvas.height - ((item - self.minValue) / (self.maxValue - self.minValue)) * main.canvas.height;
                    main.canvas.canvasContext.moveTo(0, Y);
                    main.canvas.canvasContext.lineTo(main.canvas.width, Y);
                    main.canvas.canvasContext.font = "15px 微软黑体";
                    main.canvas.canvasContext.textAlign = "right";
                    main.canvas.canvasContext.fillStyle = "#f70800";
                    main.canvas.canvasContext.fillText(item, main.canvas.width - 50, Y - 10);

                    main.canvas.canvasContext.stroke();
                    main.canvas.canvasContext.closePath();
                });

            }
        }
    };
    var position = function (x, y, value, color) {
        var self = this;
        self.x = x;
        self.y = y;
        self.value = value;
        self.color = color;
        self.display = "block";

        self.style = {
            position: 'absolute',
            left: self.x + "px",
            top: self.y + "px",
            color: self.color,
            'font-weight': "normal"
        };
        self.styleUpdate = function () {
            return {
                position: 'absolute',
                left: self.x + "px",
                top: self.y + "px",
                color: self.color,
                display: self.display,
                'font-weight': "normal"
            }
        }

    };
    //放大缩小模型
    var divScale = function () {
        var self = this;
        self.width = 0;
        self.left = 0;
        self.display = false;
        self.contextMenu = false;
        self.scaleDown = false;
        self.X = 0;
        self.Y = 0;
        self.menuStyle = function () {
            return {
                position: 'absolute',
                "z-index": 2200,
                top: self.Y + "px",
                left: self.X + "px"
            }
        };
        self.rightClick = function (e) {
            self.contextMenu = true;
            self.X = e.clientX;
            self.Y = e.clientY;
        };
        self.style = function () {
            return {
                "z-index": 2000,
                position: "absolute",
                "background-color": "#808080",
                top: main.canvas.offsetTop + "px",
                left: self.left + "px",
                height: main.canvas.height + "px",
                width: self.width + "px",
                opacity: 0.5,
                filter: "alpha(opacity = 50)"
            }
        };
        self.upEvent = function () {

            self.scaleDown = false;
            if (self.scaleNodes.length == 0) {
                var temp = new navScale(main.startDate, main.endDate, self.navScaleId);
                angular.copy(self.firstLoadData, temp.data);
                self.scaleNodes.push(temp);
                self.currScaleId = self.navScaleId++;
            };
            var seconds = ((self.left - main.canvas.offsetLeft) / main.canvas.width) * main.offsetTime;
            var start = moment(main.startDate).add(seconds, 'seconds').format("YYYY-MM-DD HH:mm:ss");
            seconds = ((self.left + self.width - main.canvas.offsetLeft) / main.canvas.width) * main.offsetTime;
            var end = moment(main.startDate).add(seconds, 'seconds').format("YYYY-MM-DD HH:mm:ss");

            QueryModel.updateTime(start, end);
            main.requsetData(QueryModel.queryParms(), function (data) {

                main.requsetSuccess(data);
                var temp = new navScale(start, end, self.navScaleId);
                angular.copy(data, temp.data);
                self.scaleNodes.push(temp);
                self.currScaleId = self.navScaleId++;
                $(".grid_btn_silder").removeClass("btn-primary");

                main.silder.refreshSilder(true);
                QueryModel.addUrlParms();
            });
            self.display = false;
            self.contextMenu = false;
            self.isCanBack = true;
            main.isScale = false;
            main.changeHisEvent();


        };
        self.currScaleId = 0;
        self.isCanBack = false;
        self.navScaleId = 0;
        self.downEvent = function () {
            var index = -1;
            for (var c in self.scaleNodes) {
                if (self.scaleNodes[c].id == self.currScaleId) {
                    index = c;
                    break;
                }
            }
            if (index - 1 >= 0) {

                main.refresh(self.scaleNodes[index - 1].data, main.requsetSuccess);
                self.scaleNodes.splice(self.scaleNodes.length - 1, 1);
                main.scale.currScaleId = self.scaleNodes[index - 1].id;
            }
            if (index - 1 <= 0) {
                self.isCanBack = false;
            }

            main.silder.refreshSilder(true);
            main.changeHisEvent();
        };
        self.scaleNodes = [];
        self.firstLoadData = {};

    };
    var navScale = function (start, end, id) {
        var self = this;
        self.id = id;
        self.start = start;

        self.end = end;
        self.text = function () {
            return moment(self.start).format("YYYY-MM-DD HH:mm:ss") + " - " + moment(self.end).format("YYYY-MM-DD HH:mm:ss")
        };
        self.data = {};
        self.changeClick = function () {
            main.refresh(self.data, main.requsetSuccess);
            main.scale.currScaleId = self.id;
            while (main.splitLines.length > 0) {
                main.splitLines.pop();

            }
        }
    };
    //竖直分割线模型
    var splitNode = function (id, x, y) {
        var self = this;
        self.id = id;
        this.X = x;
        this.Y = y;
        this.poverY = y;
        self.width = 165;
        self.popoverPosition = "right";
        self.contextMenu = false;
        self.selectClick = function (e) {

            main.currSelectSplit = self;
        };
        self.mouseRightClick = function (e) {

            main.splitLines.forEach(function (item) {

                item.contextMenu = false;
            });
            self.contextMenu = true;
            self.Y = e.clientY;
        };
        self.remove = function () {
            var index = -1;
            for (var i = 0; i < main.splitLines.length; i++) {
                if (main.splitLines[i].id == self.id) {
                    index = i;
                    break;
                }
            }
            if (index >= 0) {
                main.splitLines.splice(index, 1);
            }

        };
        self.clear = function () {
            while (main.splitLines.length > 0) {
                main.splitLines.pop();

            }
        };
        self.selectMouseUp = function (e) {

            main.currSelectSplit = null;
        };
        self.style = function () {
            return {
                height: main.canvas.height + "px",
                "z-index": 12,
                position: "absolute",
                top: main.canvas.offsetTop + "px",
                left: self.X + "px"
            }
        };
        self.menuStyle = function () {
            return {
                position: 'absolute',
                "z-index": 1200,
                top: self.Y + "px",
                left: self.X + "px"
            }
        };
        self.poverStyle = function () {
            var h = $(".popover_hr").height();
            var top = self.poverY;
            if ((top + h) > main.canvas.height + main.canvas.offsetTop) {
                top = main.canvas.height + main.canvas.offsetTop - h;
            }
            var left = self.X;
            if (self.X + self.width > main.canvas.width + main.canvas.offsetLeft) {
                self.popoverPosition = "left";
                left = left - self.width;

            } else {
                self.popoverPosition = "right";
            }
            return {
                top: top + "px",
                left: left + "px",
                display: "block"
            }
        };
        self.time = "";
        self.compTimeValue = function (value) {
            var seconds = ((value - main.canvas.offsetLeft + 1) / main.canvas.width) * main.offsetTime;
            self.time = moment(main.startDate).add(seconds, 'seconds');
            self.compValue(self.time);
        };
        self.compValue = function (time) {
            for (var c in main.nodes) {

                var arr = main.nodes[c].data;
                var date = moment(time);
                var node = null;
                if (self.poperNodes.length > c) {
                    node = self.poperNodes[c];
                    node.value = "NaN";
                } else {
                    node = new poperNode("NaN", main.nodes[c].color);
                    node.display = main.nodes[c].display;
                    self.poperNodes.push(node);
                }


                if (arr.length > 1 && date.isAfter(arr[0].time) && date.isBefore(arr[arr.length - 1].time)) {
                    for (var i = 0; i < arr.length - 1; i++) {
                        var isFind = false;
                        var findValue = 0;
                        if (date.isAfter(arr[i].time) && date.isBefore(arr[i + 1].time)) {
                            var tempX = moment(arr[i + 1].time).diff(arr[i].time, "seconds", true);
                            var tempTime = moment(time).diff(arr[i].time, "seconds", true);

                            findValue = arr[i].value + (arr[i + 1].value - arr[i].value) * (tempTime / tempX);

                            isFind = true;

                        } else if (date.isSame(arr[i].time)) {
                            findValue = arr[i].value;
                            isFind = true;
                        }

                        if (isFind) {

                            node.value = findValue.toFixed(3);
                        }
                    }
                }

                if (arr.length > 0) {
                    if (date.isSame(arr[0].time)) {
                        node.value = arr[0].value.toFixed(3);
                    } else if (date.isSame(arr[arr.length - 1].time)) {
                        node.value = arr[arr.length - 1].value.toFixed(3);
                    }
                }
                else {
                    node.value = "NaN";
                }
            }
        };
        self.poperNodes = [];
        var poperNode = function (value, color) {
            this.value = value;
            this.color = color;
            var node = this;
            node.display = true;
            this.style = function () {
                return {
                    "color": node.color
                }
            }
        };
        self.refresh = function () {
            self.compTimeValue(self.X);
        };
    };
    //图形模型
    var canvasModel = function () {
        var self = this;
        self.width = 1000;
        self.height = 400;
        self.axisXPosition = [];
        self.offsetTop = 0;
        self.offsetLeft = 0;
        self.tableRow = [1, 2, 3, 4, 5, 6, 7, 8];  //Table MaxRow
        self.labelWidth = 40; //标签实际长度的1/2
        self.labelHeight = 10; //标签实际高度的1/2
        self.canvasContext = null;

        self.canvasContextMenu = false;
        self.canvasRightClick = function (e) {
            self.canvasContextMenu = true;
            main.currMousePageX = e.clientX;
            main.currMousePageY = e.clientY;
        };
        self.canvasMenuStyle = function () {
            return {
                position: 'absolute',
                "z-index": 2400,
                top: main.currMousePageY + "px",
                left: main.currMousePageX + "px"
            }

        };
        self.canvasStyle = function () {
            return {
                "z-index": 10,
                position: 'absolute',
                top: self.offsetTop + "px",

            }
        };
        self.resizeInit = function () {
            self.width = main.$table.width();
            self.offsetLeft = main.$table.offset().left;
        };
        self.init = function () {

            self.width = main.$table.width() - 5;
            self.height = self.width * 0.35;

            var search = $location.search();

            if (typeof (search.mobile) != "undefined") {
                self.height = $(document).height() * 0.5;
            }
            // self.height = $(document).height() * 0.5;// main.$table.height();
            main.$table.height(self.height);
            self.offsetTop = main.$table.offset().top;
            self.offsetLeft = main.$table.offset().left;

            if (self.height < 300) {
                $("#tableCanvas tr").height(self.height / self.tableRow.length);
            }
        };
        self.loadAxis = function (start, end) {
            main.startDate = moment(start);
            main.endDate = moment(end);

            main.offsetTime = main.endDate.diff(main.startDate, 'seconds', true);
            var date = main.offsetTime / 4;
            var temp = main.startDate.format();
            var offsetTop = self.offsetTop + self.height + 20;

            var index = 0;
            for (var i = 0; i < 8; i += 2) {
                var left = $("tr:last td:eq(" + i + ")", main.$table).offset().left - self.labelWidth;  //减去标签长度

                var node = new position(left, offsetTop, moment(temp).add(index * date, 'seconds'), "");
                index++;
                self.axisXPosition.push(node);
            }
            var tempLeft = $("tr:last td:last", main.$table).offset().left - self.labelWidth + self.width / 8;
            if ($(window).width() < 500) {
                tempLeft = $(window).width() - 150;
            }
            else if ($(window).width() < 800) {
                tempLeft = $(window).width() - 150;
            }
            var node = new position(tempLeft, offsetTop, moment(temp).add(index * date, 'seconds'), "");

            self.axisXPosition.push(node);
            //开始结束时间改变
            if (main.startEndChangeEvent != null) {
                main.startEndChangeEvent(main.startDate, main.endDate);
            }
            if ($(window).width() < 800) {
                self.hideOrShowAxis("none");
                //self.axisXPosition[self.axisXPosition.length - 1].display = "none";
                //self.axisXPosition[self.axisXPosition.length - 2].display = "block";
            } else {
                self.hideOrShowAxis("inline-block");
            }
        };

        self.hideOrShowAxis = function (status) {
            for (var i = 1; i < self.axisXPosition.length - 1; i++) {
                self.axisXPosition[i].display = status;
            }

        };
        self.axixYAxix = function (len) {
            while (self.tableRow.length > 0) {
                self.tableRow.pop();
            }
            var getArr = function (len) {
                for (var i = 0; i < len; i++) {
                    self.tableRow.push(i);
                }
            };

            if (len <= 2) {
                getArr(8);

            } else if (len <= 10) {
                getArr(4);

            } else {
                getArr(2);

            }
            $("#tableCanvas tr").height(self.height / self.tableRow.length);
        };

        self.draw = function (nodes) {
            var canvas = document.getElementById("canvas");
            if (canvas.getContext) {

                self.canvasContext = canvas.getContext("2d");

                self.canvasContext.clearRect(0, 0, main.canvas.width, main.canvas.height);

                nodes.forEach(function (item, index) {
                    item.draw(index, nodes.length);

                });


            }
        };
        self.export = function (event) {
            $(".contextmenu,#top_canvas").hide();
            $(".canvas_value_title").each(function (item) {
                $(this).css("left", $(this).position().left + 10);
            });
            html2canvas(document.getElementById("mainExport"), {
                allowTaint: true,
                background: "#FFFFFF",
                height: main.canvas.height + 200,
                taintTest: false,
                onrendered: function (canvas) {
                    canvas.id = "mycanvas";

                    $(".canvas_value_title").each(function (item) {
                        $(this).css("left", $(this).position().left - 10);
                    });

                    var dataUrl = canvas.toDataURL("image/png");
                    //var newImg = document.createElement("img");
                    //newImg.src = dataUrl; document.body.appendChild(newImg); 

                    $http.post(main.canvasImportUrl, "image=" + encodeURIComponent(dataUrl), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).success(function (data) {
                        window.open(main.canvasExportUrl + "/" + data);
                    })
                }
            });
        };
        self.clear = function () {

            $window.location.href = main.canvasInitUrl;
        };


    };

    //时间滑动模型
    var silderRangeModel = function () {
        var self = this;
        self.defaultMin = 40;
        self.defaultMax = 60;
        self.startSilder = null;
        self.endSilder = null;
        self.silderOffset = 0;
        self.valueChanged = true;
        //init Rangeslider
        self.init = function (isHistory) {
            var min = self.defaultMin;
            var max = self.defaultMax;
            if (!isHistory) {
                min = 80;
                max = 100;
            }
            $("#dateRulersExample").rangeSlider({
                defaultValues: { min: min, max: max },
                formatter: self.formatSilder,
                arrows: false,
                step: 1,
                range: { min: 5 },
                valueLabels: "change",
            });
            $("#dateRulersExample").bind("valuesChanged", function (e, data) {
                if (main.queryModel.Querys.length < 1) {
                    return;
                }
                var start = self.formatSilder(data.values.min);
                var end = self.formatSilder(data.values.max);
                if (data.values.max - data.values.min != self.silderWidth()) {
                    $(".grid_btn_silder").removeClass("btn-primary");
                    $(".grid_btn_silder").blur();
                    if (self.silderWidthChanged != null) {
                        self.silderWidthChanged(moment(end).diff(start, 's'));
                    }
                }
                self.isCanBack = false;
                while (main.scale.scaleNodes.length > 0) {
                    main.scale.scaleNodes.pop();

                }
                if (self.valueChanged) {
                    if (moment(end).diff(moment(), 's') < 0) {
                        main.changeHisEvent();
                    }

                    QueryModel.updateTime(start, end);
                    main.requsetData(QueryModel.queryParms(), main.requsetSuccess);
                }

            });
        };

        self.isAutoRefrsh = false;
        self.initValue = function () {
            self.updateValue(self.defaultMin, self.defaultMax);
        };
        self.updateValue = function (min, max) {
            $("#dateRulersExample").rangeSlider("values", min, max);
        };
        self.formatSilder = function (val) {

            var timeFormat = moment(self.startSilder.format()).add(self.silderOffset * (val) / self.silderWidth(), 'seconds');

            return timeFormat.format("YYYY-MM-DD HH:mm:ss")
        };
        self.silderWidth = function () {
            return self.defaultMax - self.defaultMin;
        };
        self.silderWidthChanged = null;
        self.silderStartEndChanged = function (start, end, init, val) {
            if (main.queryModel.Querys.length < 1) {
                return;
            }
            var obj = $("#dateRulersExample").rangeSlider("values");

            var width = (obj.max - obj.min) / 2;
            if (init || (val < 0 && obj.min - width < 0) || (val > 0 && obj.max + width > 100)) { //固定时间范围选择，时间轴两端 偏移处理
                self.valueChanged = false; //禁用valueChanged事件
                self.updateValue(self.defaultMin, self.defaultMax);
                main.queryModel.updateTime(start.format("YYYY-MM-DD HH:mm:ss"), end.format("YYYY-MM-DD HH:mm:ss"));
                main.requsetData(main.queryModel.queryParms(), function (data) {
                    main.requsetSuccess(data);
                    self.valueChanged = true;
                    self.refreshSilder(true);
                });
                return;
            }
            self.updateValue(obj.min + val * width, obj.max + val * width);
        };

        self.refreshSilder = function (isHis) {
            var offsetSet = moment(main.endDate).diff(main.startDate, 'seconds', true);
            self.silderOffset = offsetSet;
            if (isHis) {
                self.startSilder = moment(main.startDate).add(-offsetSet * 2, 's');
                self.endSilder = moment(main.endDate).add(offsetSet * 2, 's');
            } else {
                self.startSilder = moment(main.startDate).add(-offsetSet * 4, 's');
                self.endSilder = moment(main.endDate);
            }

            main.initStartEndSilder(self.startSilder, self.endSilder);
        };
        self.autoRefreshSilder = function () {
            self.valueChanged = false;
            self.updateValue(80, 100);
            var offsetSet = moment(main.endDate).diff(main.startDate, 'seconds', true);
            self.silderOffset = offsetSet;
            self.startSilder = moment(main.startDate).add(-offsetSet * 4, 's');
            self.endSilder = moment(main.endDate);
            main.initStartEndSilder(self.startSilder, self.endSilder);

        };
    };

    var checkDisplayModel = function () {
        var self = this;
        self.canvasDisplay = true;
        self.silderDisplay = true;
        self.timeBtnDisplay = true;
        self.tableDisplay = true;
        self.navDisplay = true;
        self.checkClick = function () {
            if (self.canvasDisplay) {
                main.refresh(main.resizeData, null);
            }
        };
    };
    main.display = new checkDisplayModel();
    main.startDate = null;
    main.endDate = null;
    main.nodes = [];  //line 集合
    main.canvasUrl = "";
    main.exportUrl = "";
    main.canvasImportUrl = "";
    main.canvasExportUrl = "";
    main.canvasInitUrl = "";
    main.offsetTime = 3600;  //起始结束相隔时间 秒

    main.scale = new divScale();
    main.canvas = new canvasModel();
    main.silder = new silderRangeModel();

    main.intervalPlay = null;  //自动播放定时器
    main.intervalAutoRefresh = null;  //自动刷新定时器

    main.splitLines = [];
    main.splitIndex = 0;
    main.requsetSuccess = null;
    main.isReal = true;  //是否实时刷新

    main.monitorRefrsh = function () {
        var interFunc = function () {
            //   main.queryModel.updateTime("", "");
            main.queryModel.updateAutoTime(15);
            main.requsetData(main.queryModel.queryParms(), function (data) {
                main.requsetSuccess(data);
                $(".grid_btn_silder").removeClass("btn-primary");
                $(".btn_two").addClass("btn-primary");
                main.silder.autoRefreshSilder();
                $timeout(function () {
                    main.silder.valueChanged = true;
                }, 1000);
            });
        };
        if (main.isReal) {
            if (main.intervalAutoRefresh != null) {
                $interval.cancel(main.intervalAutoRefresh);
            }
            interFunc();
            main.intervalAutoRefresh = $interval(function () { interFunc() }, 15000);
        } else {
            if (main.intervalAutoRefresh != null) {
                $interval.cancel(main.intervalAutoRefresh);
            }
        }
    };



    //开始结束时间改变 参数：开始时间，结束时间
    main.startEndChangeEvent = null;

    main.init = function () {
        //优先初始化canvas
        main.canvas.init();
    };
    main.resize = function () {
        if (typeof (main.resizeData.Lines) !== "undefined" && main.intervalPlay === null) {
            main.refresh(main.resizeData, null);
        }



    };
    main.initStartEndSilder = null;
    main.changeHisEvent = null;

    main.requsetData = function (query, success) {
        if (query == "[]") {
            // $("#loading").addClass("loading-inactive");
            return;
        }
        if (main.queryModel.isPlay) {
            main.autoPlay(query, success);
            main.queryModel.isPlay = false;
            return;
        } else {
            if (main.intervalPlay != null) {  //处于自动播放中，重新加载数据取消自动播放
                $interval.cancel(main.intervalPlay);
                main.intervalPlay = null;
            }
            // $("#loading").removeClass("loading-inactive");
            $http.post(main.canvasUrl, query).success(function (data) {
                angular.copy(data, main.resizeData);
                main.refresh(data, success);
                //  $("#loading").addClass("loading-inactive");

            });
        }
    };

    main.autoPlay = function (query, success) {
        main.changeHisEvent();
        var index = 600;
        // $("#loading").removeClass("loading-inactive");
        var findIndex = function (arr, start) {
            var index = 0;
            for (var c in arr) {
                if (moment(arr[c].Time).isAfter(moment(start)) || moment(arr[c].Time).isSame(moment(start))) {
                    return parseInt(c);
                }
            }
            return -1;
        };
        $http.post(main.canvasUrl, query).success(function (data) {
            angular.copy(data, main.resizeData);
            var isFirst = true;
            main.intervalPlay = $interval(function () {
                var tempData = {};
                angular.copy(main.resizeData, tempData);
                var array = main.resizeData.Lines;
                for (var c in array) {
                    var find = findIndex(array[c].Data, moment(tempData.StartTime).add(index, 's'));

                    if (moment(tempData.EndTime).diff(moment(tempData.StartTime).add(index, 's'), 's') != 180 && find != -1) {
                        tempData.Lines[c].Data = tempData.Lines[c].Data.slice(0, find);
                    }

                }
                index += 180;
                main.refresh(tempData, function () {
                    if (isFirst) {
                        success(data);
                        isFirst = false;
                        $timeout(function () {
                            main.currMousePageX = main.canvas.offsetLeft + main.canvas.width / 18 - 1;
                            main.currMousePageY = main.canvas.offsetTop + main.canvas.height / 2;
                            main.mouseDbClick();
                        }, 1000);

                    }
                });


            }, 1000, 60);
            main.intervalPlay.then(function () {
                main.intervalPlay = null;
            });
            main.silder.refreshSilder(false);

            // $("#loading").addClass("loading-inactive");

        });
    };


    main.refresh = function (data, success) {
        while (main.nodes.length > 0) {
            main.nodes.pop();
        }
        while (main.canvas.axisXPosition.length > 0) {
            main.canvas.axisXPosition.pop();
        }

        main.initLineData(data);
        if (success != null) {
            success(data);
        }
    };
    main.resizeData = {};
    main.axisStart = "";
    main.axisEnd = "";
    main.showOrHidePoper = function (index, display) {
        main.splitLines.forEach(function (item) {
            item.poperNodes[index].display = display;
        });
    };
    main.changePoperColor = function (index, color) {
        main.splitLines.forEach(function (item) {
            item.poperNodes[index].color = color;
        });
    };
    main.refreshConfig = function (type, config) {
        var nodes = [];

        if (type === "ShowOrHide") {
            main.nodes.forEach(function (item, index) {
                item.display = config[index].display;
                var temp = {};
                main.queryModel.updateDisplay(index, config[index].display);
                main.showOrHidePoper(index, config[index].display);
                if (main.scale.firstLoadData.Lines && main.scale.firstLoadData.Lines.length > index) {
                    main.scale.firstLoadData.Lines[index].Display = config[index].display;

                }
                main.scale.scaleNodes.forEach(function (item) {
                    if (item.data.Lines && item.data.Lines.length >= index) {
                        item.data.Lines[index].Display = config[index].display;

                    }
                });
                if (config[index].display) {
                    angular.copy(item, temp);
                    nodes.push(temp);

                } else {
                    item.clearData();
                }
            });

        } else if (type === "Remove") {
            // { index: index, type: self.isExpressTag }
            main.nodes.splice(config.index, 1);
            main.queryModel.removeTag(config);
            main.nodes.forEach(function (item) {
                if (item.display) {
                    nodes.push(item);
                }
            });
            // angular.copy(main.nodes, nodes);
            if (main.scale.firstLoadData && main.scale.firstLoadData.Lines && main.scale.firstLoadData.Lines.length > 0) {
                main.scale.firstLoadData.Lines.splice(config.index, 1);  //删除线条 同时删除放大缩小的对应的数据
            }
            if (main.splitLines.length > 0) {
                main.splitLines.forEach(function (item) {
                    if (item.poperNodes.length !== main.nodes.length) {
                        item.poperNodes.splice(config.index, 1);
                    }

                });

            }
            if (main.nodes.length === 0) {
                main.scale.scaleNodes = [];
                main.splitLines = [];
            } else {           //删除线条 同时删除坐标轴的对应的数据
                main.scale.scaleNodes.forEach(function (item) {
                    if (item.data.Lines.length !== main.nodes.length) {
                        item.data.Lines.splice(config.index, 1);
                    }

                });
            }


        }
        else if (type === "StyleChange") {
            main.nodes.forEach(function (item, index) {

                if (config[index].color !== "") {
                    main.changePoperColor(index, config[index].color);
                    item.color = config[index].color;
                    item.style = config[index].style;
                    item.width = config[index].width;
                    main.queryModel.updateStyle(index, config[index].width, config[index].color, config[index].Field, config[index].FieldType, config[index].FieldValue);
                }
                var temp = {};
                if (config[index].display) {
                    angular.copy(item, temp);
                    nodes.push(temp);
                }
            });
            main.requsetData(main.queryModel.queryParms(), main.requsetSuccess);

        }
        else if (type === "UpdateMinMax") {
            main.nodes.forEach(function (item, index) {
                item.minValue = config[index].canvasMin;
                item.maxValue = config[index].canvasMax;
                main.queryModel.updateMinMax(index, config[index].canvasMin, config[index].canvasMax, config[index].autoMinMax);
                item.data.forEach(function (node) {
                    node.min = item.minValue;
                    node.max = item.maxValue;
                });
                var temp = {};
                if (config[index].display) {
                    angular.copy(item, temp);
                    nodes.push(temp);
                }


            });

        } else if (type === "TagRefresh") {
            if (config.index >= main.queryModel.Querys.length) {
                main.queryModel.addTag(config.tagName, false, false);

            } else {
                main.queryModel.Querys[config.index].TagName = config.tagName;

            }

            main.requsetData(main.queryModel.queryParms(), main.requsetSuccess);
            return;
        } else if (type === "OffsetTime") {
            config.forEach(function (item, index) {
                main.queryModel.updateOffset(index, item.offsetValue);
            });
            main.requsetData(main.queryModel.queryParms(), main.requsetSuccess);
            return;
        } else if (type === "FixedLine") {

            config.forEach(function (item, index) {
                console.log("Index:" + index + " Fixed:" + item.isFixedLine);
                main.queryModel.Querys[index].isDrawFixedLine = item.isFixedLine;
                main.nodes[index].isDrawFixedLine = item.isFixedLine;
            });
            angular.copy(main.nodes, nodes);
        } else if (type === "ExpressionTag") {
            if (config.edit) {
                main.queryModel.Querys[config.index].Expression = config;
                main.requsetData(main.queryModel.queryParms(), main.requsetSuccess);
                return;
            }
            main.dropNode.addTag(config, true);
            return;
        } else if (type === "FormulaTag") {
            main.dropNode.addTag(config, false, true);
            return;
        }
        else if (type === "GridAddTag") {
            main.dropNode.addTag(config, false);
        }
        main.canvas.draw(nodes);
    };
    main.initLineData = function (data) {
        main.axisStart = moment(data.StartTime);
        main.axisEnd = moment(data.EndTime);
        main.canvas.loadAxis(main.axisStart, main.axisEnd);
        main.canvas.axixYAxix(data.Lines.length);
        main.queryModel.updateTime(data.StartTime, data.EndTime);
        var array = data.Lines;

        for (var c in array) {
            var node = new lineNode(array[c].TagName, array[c].Color, [], "", array[c].Width, array[c].MinValue, array[c].MaxValue);
            node.display = array[c].Display;
            main.nodes.push(node);
            node.init(array[c].Data);
            main.queryModel.updateDisplay(c, array[c].Display);
            main.queryModel.updateOffset(c, array[c].OffsetValue);

            main.queryModel.updateStyle(c, array[c].Width, array[c].Color, array[c].Field, array[c].FieldType, array[c].FieldValue);
            main.queryModel.updateMinMax(c, array[c].MinValue, array[c].MaxValue, array[c].AutoMinMax);

            //新增极限坐标轴
            if (main.queryModel.Querys[c].isDrawFixedLine) {
                node.isDrawFixedLine = true;
            }
            node.fixedLine = main.queryModel.Querys[c].fixedLine;
        }

        var nodes = [];
        main.nodes.forEach(function (item) {
            var temp = {};
            if (item.display) {
                angular.copy(item, temp);
                nodes.push(temp);
            }
        });
        main.splitLines.forEach(function (item) {
            item.refresh();
        });
        main.canvas.draw(nodes);
    };

    main.loadDetailList = function (index, nodes) {
        var data = main.nodes[index].data;
        var offset = main.queryModel.Querys[index].OffsetValue;
        var isSameCompare = false;
        var start = main.queryModel.Querys[0].Start;
        var end = main.queryModel.Querys[0].End;
        for (var c in main.queryModel.Querys) {
            var item = main.queryModel.Querys[c];
            if ((item.Start != start || item.End != end)) {
                isSameCompare = true;
                break;
            }
        }
        for (var c in data) {
            nodes.push({ Time: moment(data[c].time).add(isSameCompare ? 0 : offset, 's'), Value: data[c].value, Confidence: data[c].confidence });
        }
    };
    var dropDivViewModel = function () {
        var self = this;
        self.X = 0;
        self.Y = 0;
        self.node = $("#div_move");
        self.title = "";
        self.value = null;
        self.display = "none";
        self.show = function () {
            self.display = "inline-block";
        };
        self.hide = function () {
            self.display = "none";
        };
        self.style = function () {
            return {
                left: self.X + "px",
                top: self.Y + "px",
                display: self.display
            };
        };
        self.addTag = null;
    };


    main.currMousePageX = 0;
    main.currMousePageY = 0;
    main.currSelectSplit = null;
    main.mouserOverEvent = function (e) {

        if (main.dropNode.value != null) {
            main.dropNode.show();
            main.dropNode.X = e.clientX + 20;
            main.dropNode.Y = e.clientY + 20;

        } else {
            main.currMousePageX = e.clientX;
            main.currMousePageY = e.clientY;
            main.canvas.canvasContextMenu = false;
            if (main.currSelectSplit != null) {
                main.currSelectSplit.X = e.clientX;
                main.currSelectSplit.compTimeValue(e.clientX);

            }
            if (main.isScale) {
                main.scale.display = true;
                main.scale.scaleDown = true;
                main.scale.X = e.clientX;
                main.scale.width = e.clientX - main.scale.left;
            }
        }


    };
    main.mouseKeyUp = function (e) {
        if (main.dropNode.value != null) {

            main.dropNode.addTag(main.dropNode.value);
            main.dropNode.value = null;
            main.dropNode.hide();
        } else {
            main.isScale = false;
        }

    };
    main.isScale = false;
    main.queryModel = QueryModel;
    main.mouseKeyDown = function (e) {
        main.splitLines.forEach(function (item) {

            item.contextMenu = false;
        });
        main.isScale = true;
        main.scale.display = false;
        main.scale.scaleDown = false;
        main.scale.contextMenu = false;
        main.canvas.canvasContextMenu = false;
        main.scale.left = e.clientX;

    };
    main.mouseLeave = function (e) {

        main.dropNode.value = null;
        main.dropNode.hide();
    };
    //鼠标双击 竖直分割线
    main.mouseDbClick = function () {
        var node = new splitNode(main.splitIndex, main.currMousePageX, main.currMousePageY);
        node.compTimeValue(main.currMousePageX);
        main.splitLines.push(node);
        main.splitIndex++;
    };
    main.gridExport = function (index) {

        var node = {};
        angular.copy(main.queryModel.Querys[index], node);
        var url = main.exportUrl + ".xlsx?name=" + node.TagName + "&start=" + node.Start + "&end=" + node.End;
        window.open(url);


    };
    QueryModel.DefaultInit();

    main.dropNode = new dropDivViewModel();
    window.addEventListener("storage", function (e) {

        main.dropNode.value = e.newValue;
        if (e.newValue !== null) {

            main.dropNode.title = e.newValue.split(':')[1];
        }

    });
    return main;
});