angular.module('TreeOrgin', []).factory("TreeOrgin", function ($http, $timeout) {
    var main = this;
    var itemHtmlNode = function (index, canvasWidth, level, count, node) {
        var self = this;
        self.defaultWidth = 150;
        self.lineHeight = 100;
        self.height = 150;
        self.canvasWidth = canvasWidth;
        self.level = level;
        self.lineCount = count;
        self.index = index; //索引 从0开始
        self.width = function () {
            var tempWidth = self.canvasWidth / 2;
            if (self.lineCount == 1) {
                tempWidth = self.canvasWidth / 4;
            }
            if (tempWidth > self.defaultWidth) {

                return self.defaultWidth;
            }
            return tempWidth;
        }
        self.X = 0;
        self.Y = 0;
        self.left = 0;
        self.style = function () {
            var parentNode = JSLINQ(main.canvas.itemNodes).First(function (item) {
                return item.node.id == self.node.parentId
            });
            if (parentNode != null) {
                self.left = parentNode.canvasWidth * parentNode.index;
            }
            if (self.lineCount == 1) {
                self.X = self.left + (self.canvasWidth - self.width()) / 2;
            } else {

                self.X = self.left + self.canvasWidth * index + (self.canvasWidth - self.width()) / 2;
            }

            self.Y = self.height * (self.level - 1);
            return {
                position: 'absolute',
                "z-index": 1200,
                top: self.Y + "px",
                left: self.X + "px",
                width: self.width() + "px",
                height: self.height + "px"
            }
        };
        self.node = node
    }
    var canvasModel = function () {
        var self = this;
        self.width = 1000;
        self.height = 400;
        self.canvasContext = null;
        self.color = "#080808";
        self.lineWidth = 0.5;
        self.offsetLeft = 0;
        self.init = function () {
            self.width = $("#main").width();
            self.height = $(document).height() * 0.8;// main.$table.height();
            self.offsetLeft = $("#canvas").offset().left;
            console.log("canvas width=" + self.width + " height=" + self.height);
            var canvas = document.getElementById("canvas");
            if (canvas.getContext) {
                console.log("clearRect drawing");
                self.canvasContext = canvas.getContext("2d");

                self.canvasContext.clearRect(0, 0, self.width, self.height);
            }
        }

        self.itemNodes = [];
        self.draw = function () {


            self.loadHtmlNode(main.treeNode, 1, self.width, 0, 1);
            console.log("itemNodesLength=" + self.itemNodes.length);

            self.canvasContext.strokeStyle = self.color;
            self.canvasContext.lineWidth = self.lineWidth;
            self.drawLine();

        }

        self.drawLine = function () {
            var list = JSLINQ(self.itemNodes);

            self.canvasContext.beginPath();
            self.itemNodes.forEach(function (item) {
                var parentNode = list.First(function (parm) {
                    return parm.node.id == item.node.parentId
                });
                if (parentNode != null) {
                    item.style();
                    parentNode.style();

                    var start = { X: parentNode.X + parentNode.width() / 2, Y: parentNode.Y + parentNode.lineHeight };
                    var end = { X: item.X + item.width() / 2, Y: item.Y };

                    console.log("start=" + angular.toJson(start));
                    console.log("end=" + angular.toJson(end));
                    self.canvasContext.moveTo(start.X-self.offsetLeft, start.Y);
                    self.canvasContext.lineTo(end.X-self.offsetLeft, end.Y);

                    return;
                }

            });
            self.canvasContext.stroke();
            self.canvasContext.closePath();

        }
        self.loadHtmlNode = function (node, level, width, index, lineCount) {
            if (typeof (node) != "undefined") {
                self.itemNodes.push(new itemHtmlNode(index, width, level, lineCount, node));

                var len = node.children.length;
                for (var c in node.children) {
                    self.loadHtmlNode(node.children[c], level + 1, width / len, parseInt(c), len);
                }
            }
        }


    }
    var treeNode = function (id, name, icon, children, level, parent) {
        var self = this;
        self.id = id;
        self.name = name;
        self.icon = icon;
        self.children = children;
        self.level = level;
        self.parentId = parent;
    }

    main.init = function () {
        main.canvas.init();
        main.treeNode = new treeNode(1, "中国", "",
            [
                new treeNode(2, "湖南", "", [
                    new treeNode(4, "长沙", "", [], 3, 2),
                    new treeNode(5, "邵阳", "", [new treeNode(9, "武冈", "", [], 4, 5),
                    new treeNode(10, "洞口", "", [], 4, 5)], 3, 2)
                ], 2, 1),
                  new treeNode(12, "湖北", "", [], 2, 1),
                new treeNode(3, "上海", "", [new treeNode(6, "浦东", "", [], 3, 3),
                    new treeNode(7, "徐汇", "", [], 3, 3), new treeNode(8, "宝山", "", [], 3, 3)], 2, 1),

                 new treeNode(13, "北京", "", [new treeNode(16, "中关村", "", [], 3, 13)], 2, 1)
            ], 1, -1);
    }
    main.treeNode = {};
    main.canvas = new canvasModel();
    return main;

})