angular.module("QueryModule", ["angularMoment"]).factory("QueryModel", function ($location, moment, $http, $timeout, $rootScope) {

    var main = this;
    main.saveTagUrl = "";
    main.templateTagUrl = "/AjaxCommon/GridHandler.ashx";
    main.groupTagUrl = "/dbweb/api/Interface/GetGrid?view=HT_PRODUCT_HISPLOTDETAIL&where=";//HISPLOTID= ///dbweb
    var model = function (tag, start, end, color) {
        this.TagName = tag;
        this.Start = start;
        this.End = end;
        this.Color = color;
        this.Width = 1; //绘图宽度
        this.Display = true;  //是否显示
        this.Min = -1;
        this.Max = -1;
        this.fixedLine = [];  //限值横线
        this.isDrawFixedLine = false;
        this.IsExpression = false;
        this.IsFormula = false;
        this.Formula = null;
        this.Expression = null;
        this.AutoMinMax = true;
        this.OffsetValue = 0;  //时间偏移量（秒）
        this.MinScale = -99999;
        this.MaxScale = 99999;
        this.Field = "BESTFIT";
        this.FieldType = "1";  //秒
        this.FieldValue = 0;
        this.IsChange = false;//是否改变过
        this.realMin = 0;
        this.realMax = 0;
    };

    var tagViewModel = function (tagName, color, name, style, maxValue, minValue) {
        this.TAG_NAME = tagName;
        this.HISPLOTDETAIL_LINESTYLE = style;//线条样式
        this.HISPLOTDETAIL_LINECOLOR = color;
        this.HISPLOTDETAIL_TAGNAME = name;
        this.HISPLOTDETAIL_MAXVALUE = maxValue || 100;
        this.HISPLOTDETAIL_MINIVALUE = minValue || 0;
    };
    main.defaultColors = ["#0066dd", "#990000", "#008000", "#800080", "#998000", "#000000", "#00ced1", "#fa8072", "#92eq06", "#cc0066", "#008080", "#663300", "#00008b", "#00cc00", "#b22222", "#00cccc"];
    main.updateTime = function (start, end) {
        main.Querys.forEach(function (item) {
            item.Start = start;
            item.End = end;
        });
    };
    main.updateAutoTime = function (seconds) {
        main.Querys.forEach(function (item) {
            if (item.Start !== "") {
                item.Start = moment(item.Start).add(seconds, 's').format("YYYY-MM-DD HH:mm:ss");
                item.End = moment(item.End).add(seconds, 's').format("YYYY-MM-DD HH:mm:ss");
            }
        });
    };
    main.updateDisplay = function (index, val) {
        main.Querys[index].Display = val;
    };
    //新增查询字段更新
    main.updateStyle = function (index, width, color, fieId, fieldType, fieldValue) {
        main.Querys[index].Color = color;
        main.Querys[index].Width = width;
        main.Querys[index].Field = fieId;
        main.Querys[index].FieldType = fieldType;
        main.Querys[index].FieldValue = fieldValue;
    };
    main.updateMinMax = function (index, min, max, auto) {
        if (auto) {
            //main.Querys[index].MaxScale = main.Querys[index].Max;
            //main.Querys[index].MinScale = main.Querys[index].Min;

            main.Querys[index].MaxScale = max;
            main.Querys[index].MinScale = min;
        }
        else {
            //main.Querys[index].Max = main.Querys[index].MaxScale;
            //main.Querys[index].Min = main.Querys[index].MinScale;

            main.Querys[index].Max = max;
            main.Querys[index].Min = min;
            main.Querys[index].IsChange = true;
        }
        main.Querys[index].AutoMinMax = auto;
    };
    main.updateOffset = function (index, offset) {
        main.Querys[index].OffsetValue = offset;
    };
    main.removeTag = function (index) {
        // { index: index, type: self.isExpressTag }

        main.Querys.splice(index.index, 1);
        main.addUrlParms();
    };
    main.getColor = function () {
        var list = JSLINQ(main.Querys);
        var color = "#080808";
        for (var c in main.defaultColors) {
            var obj = list.First(function (d) { return d.Color === main.defaultColors[c]; });
            if (obj === null) {
                color = main.defaultColors[c];
                break;
            }
        }
        return color;
    };
    main.addTag = function (name, expression, formula) {
        if (main.Querys.length === main.defaultColors.length || name.length < 1) {
            alert("已经达到位号最大数量,无法添加！");
            return;
        }
        var color = main.getColor();
        var node = new model(name, "", "", color);
        if (expression) {
            node.IsExpression = true;
            node.TagName = name.text;
            node.Expression = name;
        }
        if (formula) {
            node.IsFormula = true;
            node.IsExpression = true;
            node.TagName = name.text;
            node.Formula = name;
        }
        if (main.Querys.length > 0) {
            node.Start = main.Querys[0].Start;
            node.End = main.Querys[0].End;
        }
        var index = 0;
        var tagList = "";
        for (const c in main.Querys) {
            if (!(main.Querys[c].IsExpression || main.Querys[c].IsFormula)) {
                tagList += (main.Querys[c].TagName + "|");

            }

            if (main.Querys[c].TagName === name) {
                index = -1;
            }
        }

        if (index === 0) {
            main.Querys.push(node);
        }
        if (!(expression || formula)) {
            $location.search("TagName", tagList + name);
            $location.replace();
        }

        return index;
    };
    main.addUrlParms = function () {
        var tagList = "";
        for (var c in main.Querys) {
            if (!(main.Querys[c].IsExpression || main.Querys[c].IsFormula)) {
                tagList += ("|" + main.Querys[c].TagName);
            }
        }
        $location.search("TagName", tagList.substring(1));
    };
    main.Querys = [];
    main.isHisotory = false;
    main.isPlay = false;
    main.initPush = function (name, min, max) {
        var temp = new model(name, "", "", "");
        temp.AutoMinMax = false;
        temp.Min = min;
        temp.Max = max;
        temp.MinScale = min;
        temp.MaxScale = max;
        main.Querys.push(temp);
    };
    main.DefaultInit = function () {
        $(".btn_two").addClass("btn-primary");

        var search = $location.search();
        var nodes = [];
        if (typeof (search.Id) !== "undefined") {

            if (typeof (search.Scale) !== "undefined") {
                main.saveTag.groupRelative = search.Scale;
            }
            else if (typeof (search.scale) !== "undefined") {
                main.saveTag.groupRelative = search.scale;
            }

            var rule = {
                op: "and", rules: [{
                    op: "equal",
                    field: "HISPLOTID",
                    value: search.Id,
                    type: "string"
                }], groups: []
            };

            $http.get(main.groupTagUrl + JSON.stringify(rule) + "&sortName=HISPLOTDETAILID&sortOrder=asc").success(function (json) {
                main.saveTag.hisId = search.Id;
                var data = JSON.parse(json);
                data.forEach(function (item) {
                    var obj = new model(item.HISPLOTDETAIL_SERVER + ":" + item.HISPLOTDETAIL_TAGNAME, "", "", item.HISPLOTDETAIL_LINECOLOR);
                    obj.Min = obj.MinScale = item.HISPLOTDETAIL_MINIVALUE;
                    obj.Max = obj.MaxScale = item.HISPLOTDETAIL_MAXVALUE;
                    obj.AutoMinMax = main.saveTag.groupRelative == 1;
                    nodes.push(obj);
                });
                nodes.forEach(function (item) {
                    main.Querys.push(item);
                });
                $rootScope.$broadcast("ngRepeatFinished");
            }).error(function () {
                $rootScope.$broadcast("ngRepeatFinished");
            });
        }
        else {
            if (typeof (search.TagName) != "undefined") {
                //模板点位号支持
                var tagTemplate = search.TagName.split(/ |%20/);

                //Update By ZYX 20181011 修改如果位号为模板点时并且参数存在时间的错误
                //if (search.TagName.split('|').length == 1 && tagTemplate.length > 1) {
                if (search.TagName.split('|').length == 1
                    && tagTemplate.length > 1
                    && typeof (search.StartDate) == "undefined"
                    && typeof (search.EndDate) == "undefined") {
                    var tagTemplateArr = tagTemplate[0].split(":");
                    if (tagTemplateArr.length > 1) {
                        var filter = {
                            op: 'and',
                            rules: [
                                { field: 'SERVER_NAME', value: tagTemplateArr[0].toUpperCase(), op: 'equal', type: 'string' }
                                , { field: 'TAGINFO_NAME', value: tagTemplateArr[1].toUpperCase() + " ", op: 'like', type: 'string' }
                            ]
                        };

                        $http.get(main.templateTagUrl + "?view=ht_base_taginfo&where=" + JSON.stringify(filter)).success(function (data) {
                            if (!data || !data.Total) {
                                return;
                            }
                            for (var i = 0; i < data.Total; i++) {
                                var name = data.Rows[i].SERVER_NAME + ":" + data.Rows[i].TAGINFO_NAME;
                                main.Querys.push(new model(name, "", "", ""));
                            }
                            $rootScope.$broadcast("ngRepeatFinished");
                        });
                    }
                }
                else {
                    search.TagName.split('|').forEach(function (item, index) {
                        if (item.length > 0) {
                            nodes.push(new model(item, "", "", main.defaultColors[index]));

                        }
                    });
                }
            }
            if (typeof (search.TagColor) != "undefined") {
                var arrColors = search.TagColor.split('|');
                for (var c in arrColors) {
                    nodes[c].Color = arrColors[c];
                }
            }

            if (typeof (search.TagMinScaleList) != "undefined") {
                var tagMinScaleList = search.TagMinScaleList.split('|');
                for (var c in tagMinScaleList) {
                    nodes[c].MinScale = tagMinScaleList[c];
                }
            }
            if (typeof (search.TagMaxScaleList) != "undefined") {
                var tagMaxScaleList = search.TagMaxScaleList.split('|');
                for (var c in tagMaxScaleList) {
                    nodes[c].MaxScale = tagMaxScaleList[c];
                }
            }
            if (typeof (search.FixedLine) != "undefined") {
                var fixedLineList = search.FixedLine.split('|');
                var isFirstFixed = true;
                for (var c in fixedLineList) {
                    if (fixedLineList[c].length > 0) {
                        if (isFirstFixed) {   //对于多个极限横轴 只显示一个位号
                            nodes[c].isDrawFixedLine = true;
                            isFirstFixed = false;
                        }
                        fixedLineList[c].split(',').forEach(function (item) {
                            nodes[c].fixedLine.push(parseFloat(item));
                        });
                    }
                }
            }
            if (typeof (search.StartDate) != "undefined" && typeof (search.EndDate) != "undefined") {
                var startDates = search.StartDate.split('|');
                var endDates = search.EndDate.split('|');
                if (startDates.length == endDates.length) {
                    $(".btn_two").removeClass("btn-primary");
                    main.isHisotory = true;
                    var minDate = moment(startDates[0]);
                    for (var c in startDates) {
                        nodes[c].Start = startDates[c];
                    }
                    nodes.forEach(function (item, i) {
                        item.OffsetValue = moment(item.Start).diff(minDate, 'seconds');
                        item.Start = moment(minDate).format("YYYY-MM-DD HH:mm:ss");

                        var index = i;
                        if (endDates.length < i + 1) {
                            index = endDates.length - 1;
                        }
                        item.End = endDates[index];
                        item.End = moment(item.End).add(-(item.OffsetValue), 'seconds').format("YYYY-MM-DD HH:mm:ss");
                    });
                    //for (var c in endDates) {
                    //	nodes[c].End = endDates[c];
                    //	nodes[c].End = moment(nodes[c].End).add(-(nodes[c].OffsetValue), 'seconds').format("YYYY-MM-DD HH:mm:ss");
                    //}
                }
            }
            if (typeof (search.AutoMinMax) != "undefined") {
                var autos = search.AutoMinMax.split('|');
                for (var c in autos) {
                    nodes[c].AutoMinMax = (autos[c] != 'false');
                    nodes[c].Max = nodes[c].MaxScale;
                    nodes[c].Min = nodes[c].MinScale;
                }
            }
            nodes.forEach(function (item) {
                main.Querys.push(item);
            });
            if (typeof (search.PlayDate) != "undefined") {
                main.isPlay = true;
                main.isHisotory = true;
                $(".btn_two").removeClass("btn-primary");
                var playDates = search.PlayDate;
                for (var c in main.Querys) {
                    main.Querys[c].Start = moment(playDates);
                    main.Querys[c].End = moment(playDates).add(180 * 60, "seconds");
                }
            }
        }
    };
    main.queryParms = function () {
        return angular.toJson(main.Querys);
    };

    var saveTagModel = function () {
        var self = this;
        self.isLoadGroup = false;
        self.groupName = "";
        self.hisId = -1;
        self.groupSort = 1;
        self.groupDetail = "";
        self.groupRelative = 1;
        self.alertClass = "alert alert-success";
        self.alertShow = false;
        self.alertMessage = "正在保存....";
        self.save = function () {
            var url = main.saveTagUrl + "?method=SaveHisplotGroup&type=HisplotGroup&DATA_JSON=";
            var jsonData = [];
            main.Querys.forEach(function (item) {
                var maxValue = item.MaxScale;
                var minValue = item.MinScale;
                if (!item.AutoMinMax || (item.AutoMinMax && !item.IsChange)) {
                    maxValue = item.Max;
                    minValue = item.Min;
                }
                jsonData.push(new tagViewModel(item.TagName, item.Color, item.TagName.split(':')[1], parseFloat(item.Width + ""), maxValue, minValue));
            });
            //console.log(jsonData);
            //   var orgID = 12;

            var orgID = JSON.parse($.cookie("ckequipdata")).ID;
            var postData = "&HISPLOTID=" + self.hisId + "&EQUIPID=" + orgID + "&HISPLOT_RELATIVE=" + self.groupRelative + "&HISPLOT_STARTTIME=&HISPLOT_ENDTIME=&HISPLOT_PUBLIC=0&HISPLOT_NAME=" + encodeURIComponent(self.groupName) + "&HISPLOT_DETAIL=" + encodeURIComponent(self.groupDetail) + "&SHOW_ORDER=" + self.groupSort;
            $http.post(url + encodeURIComponent(angular.toJson(jsonData)) + postData).success(function (data) {
                self.alertShow = true;
                self.alertMessage = data.Message;
                if (data.IsError) {
                    self.alertClass = "alert alert-danger";
                } else {
                    self.alertClass = "alert alert-success";
                    $timeout(function () { $("#saveTagModal").modal("hide"); }, 1000);
                }
            });
        };
        self.open = function () {
            self.alertShow = false;
            //self.groupName = "";
            //self.groupSort = 1;
            //self.groupDetail = "";
            if (!self.isLoadGroup && self.hisId != -1) {

                var rule = {
                    op: "and", rules: [{
                        op: "equal",
                        field: "HISPLOTID",
                        value: self.hisId,
                        type: "string"
                    }], groups: []
                };

                $http.get(main.groupTagUrl.replace("HT_PRODUCT_HISPLOTDETAIL", "HT_PRODUCT_HISPLOT") + JSON.stringify(rule)).success(function (json) {
                    self.isLoadGroup = true;
                    var data = JSON.parse(json);
                    self.groupName = data[0].HISPLOT_NAME;
                    self.groupRelative = data[0].HISPLOT_RELATIVE;
                    self.groupDetail = data[0].HISPLOT_CREATEUSER;
                    self.groupSort = data[0].SHOW_ORDER;
                    $("#saveTagModal").modal("show");
                });
            } else {
                $("#saveTagModal").modal("show");
            }
        };
    };

    main.saveTag = new saveTagModel();
    return main;
});