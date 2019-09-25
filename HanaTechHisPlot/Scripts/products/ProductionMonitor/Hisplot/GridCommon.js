angular.module("Grid", ["minicolors", "xeditable", "angularMoment"]).factory("GridCommon", function ($http, $location, moment, $rootScope, $timeout) {
    var main = this;
    main.List = []; //位号列表
    main.startDate = "2016-01-01 00:00:00";
    main.endDate = "2016-01-01 02:00:00";
    main.timeOffset = "";//间隔时间
    main.isReal = true; //是否实时刷新
    main.preOpenModalIsReal = false;
    main.isCheck = true;
    main.vailUrl = "";
    main.realHisClass = "glyphicon glyphicon-stop";
    main.realHisColor = "btn btn-danger";
    main.tagDetailList = [];
    var gridViewModel = function (id, color, name, text, unit, status, isCheck, min, max, timeOffset, minScale, maxScale) {
        var self = this;
        self.Id = id;
        self.isFixedLine = false;
        self.isFixedDisplay = false;
        self.isInputTag = false;
        self.isExpressTag = false;
        self.isFormula = false;
        self.Formula = null;
        self.Expression = null;
        self.hasError = "";
        self.Name = name;
        self.Text = text;
        self.Unit = unit;
        self.Status = status;
        self.IsCheck = isCheck;
        self.currMin = min;
        self.currMax = max;
        self.Min = min;
        self.Max = max;
        self.TimeOffset = timeOffset;
        self.minScale = minScale;
        self.maxScale = maxScale;
        self.rowClass = "";
        self.FieldValue = 0;
        self.Field = "";
        self.FieldType = "1";
        self.RealMin = 0;//数据最小值
        self.RealMax = 0;//数据最大值
        self.AvgValue = 0;//平均值
        self.setMinMax = function (min, max, compMin, compMax) {
            self.currMin = parseFloat(compMin.toFixed(3));
            self.currMax = parseFloat(compMax.toFixed(3));
            if (self.IsCheck) {
                self.Min = parseFloat(min.toFixed(3));
                self.Max = parseFloat(max.toFixed(3));
            } else {
                self.Min = parseFloat(self.minScale.toFixed(3));
                self.Max = parseFloat(self.maxScale.toFixed(3));
            }
            self.changeModel.canvasMin = self.Min;
            self.changeModel.canvasMax = self.Max;
        };
        self.setFixedLine = function (index) {
            if (self.isFixedLine) {
                main.List.forEach(function (item, d) {
                    item.isFixedLine = false;
                    item.changeModel.isFixedLine = false;
                });
                self.isFixedLine = true;
            } else {
                main.List.forEach(function (item, d) {
                    item.isFixedLine = false;
                    item.changeModel.isFixedLine = false;
                });
            }
            self.changeModel.isFixedLine = self.isFixedLine;
            main.gridConfigChanged("FixedLine", main.getChangeModes());
            //console.log(index + " value :" + self.isFixedLine);
        };
        self.updateMinMax = function (send) {
            if (!self.IsCheck) {
                self.Min = self.minScale;
                self.Max = self.maxScale;
            } else {
                self.Min = self.currMin;
                self.Max = self.currMax;
            }
            self.changeModel.autoMinMax = self.IsCheck;
            self.changeModel.canvasMin = self.Min;
            self.changeModel.canvasMax = self.Max;
            if (send) {
                main.gridConfigChanged("UpdateMinMax", main.getChangeModes());
            }
        };
        self.changeModel = new changeModel();
        self.showOrHideClick = function (index) {
            if (self.rowClass === "danger") {
                self.rowClass = "";
                self.changeModel.display = true;
            } else {
                self.rowClass = "danger";
                self.changeModel.display = false;
            }
            main.gridConfigChanged("ShowOrHide", main.getChangeModes());
        };
        self.minSaveClick = function () {
            self.changeModel.canvasMin = self.Min;
            self.minScale = self.Min;
            self.IsCheck = false;
            self.changeModel.autoMinMax = self.IsCheck;
            main.gridConfigChanged("UpdateMinMax", main.getChangeModes());
        };
        self.maxSaveClick = function () {
            self.changeModel.canvasMax = self.Max;
            self.maxScale = self.Max;
            self.IsCheck = false;
            self.changeModel.autoMinMax = self.IsCheck;
            main.gridConfigChanged("UpdateMinMax", main.getChangeModes());
        };
        self.offsetStr = function (value) {
            if (value < 10) {
                return "0" + value;
            } else {
                return value;
            }
        };
        self.offsetDirect = true; //偏移方向 加
        self.offsetClass = "glyphicon glyphicon-plus";
        self.offsetChange = function () {
            if (self.offsetDirect) {
                self.offsetClass = "glyphicon glyphicon-minus";
            } else {
                self.offsetClass = "glyphicon glyphicon-plus";
            }
            self.offsetDirect = !self.offsetDirect;
            self.offsetTimeChange();
            return false;
        };
        //偏移量时间 事件 属性
        self.offsetHour = 0;
        self.initOffset = function () {
            if (self.TimeOffset >= 0) {
                self.offsetDirect = true;
                self.offsetClass = "glyphicon glyphicon-plus";
            } else {
                self.offsetDirect = false;
                self.offsetClass = "glyphicon glyphicon-minus";
            }
            self.offsetHour = Math.abs(parseInt(self.TimeOffset / 3600));
            self.offsetMinutes = parseInt((Math.abs(self.TimeOffset) - self.offsetHour * 3600) / 60);
            self.offsetSecond = Math.abs(self.TimeOffset) - self.offsetHour * 3600 - self.offsetMinutes * 60;
        };
        self.offsetTotalSeconds = 0;
        //偏移量时间变化事件
        self.offsetTimeChange = function () {
            var dict = 1;
            self.offsetTotalSeconds = self.offsetHour * 3600 + self.offsetMinutes * 60 + self.offsetSecond;
            if (!self.offsetDirect) {
                dict = -1;
            }
            self.changeModel.offsetValue = self.offsetTotalSeconds * dict;
            main.gridConfigChanged("OffsetTime", main.getChangeModes());
            main.changeHisEvent();
        };
        self.offsetMinutes = 0;
        self.offsetSecond = 0;
        self.tagDbClick = function (index) {
            if (self.isExpressTag && !self.isFormula) {
                main.config.currModelTitle = self.Expression.Left + self.Expression.Compare + self.Expression.Right;

            } else if (self.isFormula) {
                main.config.currModelTitle = self.Formula.TagName + self.Formula.Operation + self.Formula.Value;
            } else {
                main.config.currModelTitle = self.Name;
            }
            while (main.tagDetailList.length > 0) {
                main.tagDetailList.pop();
            }
            main.currId = self.Id;
            $("#myModal").modal("show");
            main.loadDetailListEvent(index, main.tagDetailList);
        };
        //线条颜色设置
        self.Color = color;
        self.Width = 1;
        self.inputName = "";
        self.Style = "solid"; //实线
        self.CssStyle = function () {
            return {
                'border-color': self.Color,
                'border-style': self.Style,
                'border-width': self.Width + "px"
            };
        };
        self.CssDbClick = function () {
            main.config.currModelStyle = self.CssStyle;
            main.config.currModelTitle = self.Name;
            main.config.currColor = self.Color;
            main.config.currField = self.Field;
            main.config.currFieldValue = self.FieldValue;
            main.config.currFieldType = self.FieldType;
            main.config.currTitleBg = {
                "color": self.Color
            };
            main.config.currBordColor = {
                "border-color": self.Color
            };
            main.currId = self.Id;
            main.config.currRadioValue = self.Style + "_" + self.Width;
            if (self.Field === "BESTFIT") {
                $("#currFiledInputValue").attr("readonly", "readonly");
                $("#currFiledSelect").attr("disabled", "disabled");
            } else {
                $("#currFiledInputValue").removeAttr("readonly");
                $("#currFiledSelect").removeAttr("disabled");
            }
            $("#colorModal").modal("show");
        };
        self.remove = function (index) {
            main.List.splice(index, 1);
            main.gridConfigChanged("Remove", { index: index, type: self.isExpressTag });
        };
        self.getTipName = function () {

            return self.Name;
        };
        self.enterEvent = function (e, index) {
            var keycode = window.event ? e.keyCode : e.which;

            if (keycode === 13) {
                self.inputBlur(index);
                //var name = self.inputName;
                //if (name.length < 0 || self.inputName === self.Name) {
                //    self.isInputTag = false;
                //    return;
                //}
                //main.List.splice(main.List.length - 1, 1);
                //main.gridConfigChanged("GridAddTag", name);
            }
        };
        self.inputBlur = function (index) {
            self.hasError = "";
            if (self.inputName === self.Name) {
                self.isInputTag = false;
                return;
            }
            if (self.inputName.trim() === "") {
                self.isInputTag = false;
                main.List.splice(index, 1);
               

            }
            var inputName = encodeURIComponent(self.inputName);
            $http.post(main.vailUrl + "?expression=" + inputName).success(function (data) {
                if (data.state) {
                    self.Name = self.inputName;
                    main.gridConfigChanged("TagRefresh", { index: index, tagName: self.Name });
                    self.isInputTag = false;
                   
                } else {
                    self.hasError = "has-error";                  
                }

            });
        


        };
        self.edit = function (e) {
            if (self.isExpressTag) {
                main.expression.type = self.Expression.Compare;
                main.expression.leftValue = self.Expression.Left;
                main.expression.rightValue = self.Expression.Right;
                main.expression.leftSuccess = self.Expression.LeftAck;
                main.expression.rightSuccess = self.Expression.RightAck;
                main.expression.edit = true;
                main.expression.editIndex = e;
                $("#formulaModal").modal("show");
                return;
            }
            self.isInputTag = true;
            self.inputName = self.Name;
            setTimeout(function () {
                $("#inputTag_" + e).focus();
                console.log("inputis");
            }, 100);

        };
    };
    var rangSilderModel = function () {
        var self = this;
        self.startSilder = null;
        self.endSilder = null;
        self.offsetTotalSeconds = 7200;//间隔时间
        self.offsetDay = 0;
        self.offsetHour = 2;
        self.offsetMinutes = 0;
        self.offsetSecond = 0;
        self.offsetDiv = true;
        self.customChangePreTime = null;
        self.preSilderEvent = function () {
            var temp = moment(main.endDate).diff(main.startDate, 's') / 2;
            main.endDate = moment(main.startDate).add(temp, 's');
            main.startDate = moment(main.startDate).add(-temp, 's');
            main.changeHisEvent();
            main.silderStartEndChanged(main.startDate, main.endDate, false, -1);
        };
        self.offsetActive = function () {
            $("#silder-offset-btn").addClass("btn-primary");
            $("#silder-custom-btn").removeClass("btn-primary");
            self.offsetDiv = true;
            $("#modal_end").val(self.customChangePreTime);
        };
        self.customActive = function () {
            $("#silder-custom-btn").addClass("btn-primary");
            $("#silder-offset-btn").removeClass("btn-primary");
            self.offsetDiv = false;
            self.customChangePreTime = $("#modal_end").val();
        };
        self.endActice = function () {
            $("#form-group-endTime").removeClass("has-error");
        };
        self.nextSilderEvent = function () {
            var temp = moment(main.endDate).diff(main.startDate, 's') / 2;
            main.startDate = moment(main.endDate).add(-temp, 's');
            main.endDate = moment(main.endDate).add(temp, 's');
            main.changeHisEvent();
            main.silderStartEndChanged(main.startDate, main.endDate, false, 1);
        };
        self.offsetBtnChange = function (val, id) {
            $(".grid_btn_silder").removeClass("btn-primary");
            $(id).addClass("btn-primary");
            var start = moment(main.endDate).add(-val, 's');
            self.offsetTotalSeconds = val;
            self.offsetChange(val);
            main.changeHisEvent();
            main.silderStartEndChanged(start, moment(main.endDate), true, 0);
        };
        self.offsetModalBtnChange = function (val, id) {
            $(".group_silder .grid_btn_silder").removeClass("btn-primary");
            $(id).addClass("btn-primary");
            self.offsetChange(val);
            self.offsetUpdate(false);
        };
        self.offsetUpdate = function (remove) {
            if (remove) {
                $(".group_silder .grid_btn_silder").removeClass("btn-primary");
            }
            var endTime = moment($("#modal_start").val()).add(self.offsetDay, 'd');
            endTime = endTime.add(self.offsetHour, 'h');
            endTime = endTime.add(self.offsetMinutes, 'm');
            endTime = endTime.add(self.offsetSecond, 's');
            main.endDate = endTime.format("YYYY-MM-DD HH:mm:ss");
        };
        self.startChange = function () {
            if (!self.offsetDiv) {
                return;
            }
            var endTime = moment($("#modal_start").val()).add(self.offsetDay, 'd');
            endTime = endTime.add(self.offsetHour, 'h');
            endTime = endTime.add(self.offsetMinutes, 'm');
            endTime = endTime.add(self.offsetSecond, 's');
            main.endDate = endTime.format("YYYY-MM-DD HH:mm:ss");
        };
        self.endChange = function () {
            if (!self.offsetDiv) {
                return;
            }
            var endTime = moment($("#modal_end").val()).add(-self.offsetDay, 'd');
            endTime = endTime.add(-self.offsetHour, 'h');
            endTime = endTime.add(-self.offsetMinutes, 'm');
            endTime = endTime.add(-self.offsetSecond, 's');
            main.startDate = endTime.format("YYYY-MM-DD HH:mm:ss");
        };
        self.offsetChange = function (val) {
            if (val / 3600 >= 24) {
                self.offsetDay = val / (3600 * 24);
                self.offsetHour = 0;
                self.offsetMinutes = 0;
                self.offsetSecond = 0;
            } else {
                self.offsetDay = 0;
                self.offsetMinutes = 0;
                self.offsetSecond = 0;
                self.offsetHour = val / 3600;
            }
        };
        self.getTotalSeconds = function () {
            return self.offsetDay * 86400 + self.offsetHour * 3600 + self.offsetMinutes * 60 + self.offsetSecond;
        };
        self.offsetApply = function () {
            if (moment($("#modal_start").val()).diff(moment($("#modal_end").val()), 's') > 0) {
                $("#form-group-endTime").addClass("has-error");
                return;
            }
            var id = $(".group_silder button[class$='btn-primary']").attr("id");
            $("#gridtooblr .grid_btn_silder").removeClass("btn-primary");
            if (id != null) {
                $("." + id).addClass("btn-primary");
            }
            if (moment($("#modal_end").val()).diff(moment()) < 0) {
                main.preOpenModalIsReal = false;
                main.changeHisEvent();
            }
            main.startEndChangedEvent($("#modal_start").val(), $("#modal_end").val());
            //console.log($("#modal_start").val() + " - " + $("#modal_end").val());
            $("#ModalConfig").modal("hide");
        };
        self.silderUpdateOffset = function (seconds) {
            self.offsetDay = parseInt(seconds / 86400);
            self.offsetHour = parseInt((seconds - self.offsetDay * 86400) / 3600);
            self.offsetMinutes = parseInt((seconds - self.offsetDay * 86400 - self.offsetHour * 3600) / 60);
            self.offsetSecond = seconds - self.offsetDay * 86400 - self.offsetHour * 3600 - self.offsetMinutes * 60;
        };
    };
    var changeModel = function (index) {
        this.index = index;
        this.color = "";
        this.style = "";
        this.width = "";
        this.display = true;
        this.canvasMin = null;
        this.canvasMax = null;
        this.autoMinMax = true;
        this.offsetValue = 0;
        this.isFixedLine = false;
        this.Field = "BESTFIT";
        this.FieldValue = 0;
        this.FieldType = "1";
    };
    main.getChangeModes = function () {
        var nodes = [];
        main.List.forEach(function (item) {
            nodes.push(item.changeModel);
        });
        return nodes;
    };
    var gridConfigModel = function () {
        var self = this;
        self.currModelStyle = {};
        self.currModelTitle = "";
        self.currColor = "#990099";
        self.currField = "BESTFIT";
        self.currFieldValue = 0;
        self.currFieldType = "1";
        self.currTitleBg = {
            "color": self.currColor
        };
        self.currBordColor = {
            "border-color": self.currColor
        };
        //minicolors 配置
        self.customSettings = {
            control: 'brightness',
            theme: 'bootstrap',
            position: 'bottom left',
            swatches: ["#0066dd", "#990000", "#008000", "#800080", "#998000", "#000000", "#00ced1", "#00cc00", "#b3ac5d", "#00cccc", "#ffeb3b", "#ff9800", "#795548", "#9e9e9e"]
        };
        self.tabChange = function (obj, e) {
            e.preventDefault();
            $(obj).tab('show');
        };
        self.currRadioValue = "";
        self.selectChange = function () {
            if (self.currField === "BESTFIT") {
                self.currFieldValue = 0;
                self.currFieldType = "1";
                $("#currFiledInputValue").attr("readonly", "readonly");
                $("#currFiledSelect").attr("disabled", "disabled");
            } else {
                $("#currFiledInputValue").removeAttr("readonly");
                $("#currFiledSelect").removeAttr("disabled");
                self.currFieldValue = 1;
                self.currFieldType = "3600";
            }
        };
        self.applyCurr = function () {
            var value = self.currRadioValue.split('_');
            var index = -1;
            for (var c in main.List) {
                if (main.List[c].Id === main.currId) {
                    index = c;
                    break;
                }
            }
            if (index !== -1) {
                var model = main.List[index];
                model.Color = main.config.currColor;
                model.Width = value[1];
                model.Style = value[0];
                model.changeModel.Field = model.Field = main.config.currField;
                model.changeModel.FieldValue = model.FieldValue = main.config.currFieldValue;
                model.changeModel.FieldType = model.FieldType = main.config.currFieldType;
                model.changeModel.width = value[1];
                model.changeModel.color = model.Color;
                model.changeModel.style = model.Style;
                model.CssStyle = {
                    'border-color': model.Color,
                    'border-style': model.Style,
                    'border-width': model.Width + "px"
                };
                main.gridConfigChanged("StyleChange", main.getChangeModes());
            }
        };
        self.export = function () {
            var index = -1;
            for (var c in main.List) {
                if (main.List[c].Id === main.currId) {
                    index = c;
                    break;
                }
            }
            if (index !== -1) {
                main.exportExcel(index);
            }
        };
    };

    var expressionModel = function () {
        var self = this;
        self.edit = false;
        self.editIndex = 0;
        self.type = ">=";
        self.leftValue = "";
        self.rightValue = "";
        self.leftSuccess = "";
        self.rightSuccess = "";
        self.isError = false;
        self.openModal = function () {
            self.edit = false;
            self.leftValue = "";
            self.rightValue = "";
            self.leftSuccess = "";
            self.rightSuccess = "";
            $("#formulaModal").modal("show");
        };
        self.save = function () {
            $http.post(main.vailUrl + "?expression=" + self.toCode()).success(function (data) {
                if (data.state) {

                    var expression = "IF(" + self.leftValue + "" + self.type + "" + self.rightValue + ",";
                    var res = "" + self.leftSuccess + "," + self.rightSuccess + ")";
                    var config = {
                        Left: self.leftValue,
                        Right: self.rightValue,
                        Compare: self.type,
                        LeftAck: self.leftSuccess,
                        RightAck: self.rightSuccess
                    };
                    main.gridConfigChanged("ExpressionTag", {
                        text: expression + res,
                        Left: self.leftValue,
                        Right: self.rightValue,
                        Compare: self.type,
                        LeftAck: self.leftSuccess,
                        RightAck: self.rightSuccess,
                        edit: self.edit,
                        index: self.editIndex
                    });
                    if (self.edit) {
                        main.List[self.editIndex].Name = expression + res;
                        main.List[self.editIndex].Expression = config;
                    }


                    $("#formulaModal").modal("hide");

                } else {
                    self.isError = true;
                    $timeout(() => {
                        self.isError = false;
                    }, 2000);
                }

            });
        };
        self.canSave = function () {

            return self.leftValue && self.leftSuccess && self.rightValue && self.rightSuccess;
        };
        self.toCode = function () {
            var expression = "(" + self.leftValue + ")" + self.type + "(" + self.rightValue + ")?";
            var res = "(" + self.leftSuccess + "):(" + self.rightSuccess + ")";
            return encodeURIComponent(expression + res);
        };
        self.toDisplay = function () {

            return self.leftValue + " " + self.type + " " + self.rightValue;
        };
    };
    var formulaModel = function () {
        var self = this;
        self.edit = false;
        self.editIndex = 0;
        self.tagName = "";
        self.operation = "+";
        self.value = "";
        self.isError = false;

        self.save = function () {
            $http.post(main.vailUrl + "?expression=" + self.toCode()).success(function (data) {
                if (data.state) {
                    if (self.edit) {
                        main.List.splice(self.editIndex, 1);
                        main.gridConfigChanged("Remove", { index: self.editIndex, type: true });
                    }
                    var expression = "(1>0)?(" + self.tagName + self.operation + self.value + "):(0)";
                    main.gridConfigChanged("FormulaTag", {
                        text: expression,
                        TagName: self.tagName,
                        Value: self.value,
                        Operation: self.operation

                    });
                    $("#formulaSampleModal").modal("hide");

                } else {
                    self.isError = true;
                    $timeout(() => {
                        self.isError = false;
                    }, 2000);
                }

            });
        };
        self.canSave = function () {

            return self.value;
        };
        self.toCode = function () {
            var expression = "(1>0)?(" + self.tagName + self.operation + self.value + "):(0)";
            return encodeURIComponent(expression);
        };
        self.toDisplay = function () {

            return self.tagName + self.operation + self.value;
        };

    };
    main.silder = new rangSilderModel();
    main.config = new gridConfigModel();
    main.expression = new expressionModel();
    main.formula = new formulaModel();
    main.updateAutoTimeEvent = null;
    //实时 历史切换事件
    main.realOrHisEvent = function () {
        if (main.isReal) {
            main.realHisClass = "glyphicon glyphicon-play";
            main.realHisColor = "btn btn-primary";
            main.updateRealOrHis(false);
        } else {
            main.realHisClass = "glyphicon glyphicon-stop";
            main.realHisColor = "btn btn-danger";
            main.updateAutoTimeEvent();
            main.updateRealOrHis(true);
        }
        main.isReal = !main.isReal;
    };
    main.timeModalEvent = function () {
        main.preOpenModalIsReal = main.isReal;
        $("#ModalConfig").modal("show");
        if (main.isReal) {
            main.realHisClass = "glyphicon glyphicon-play";
            main.realHisColor = "btn btn-primary";
            main.updateRealOrHis(false);
        }
    };
    main.changeHisEvent = function () {
        if (moment(main.endDate).diff(moment(), 's') < 0) {
            main.isReal = false;
            main.realHisClass = "glyphicon glyphicon-play";
            main.realHisColor = "btn btn-primary";
            main.updateRealOrHis(false);
        }
    };
    main.updateRealOrHis = null;
    main.silderStartEndChanged = null;
    main.loadDetailListEvent = null;
    main.gridConfigChanged = null;
    main.offsetStr = function (value) {
        if (parseInt(value) < 10 && parseInt(value) >= 0) {
            return "0" + value;
        } else {
            return value;
        }
    };
    main.startEndChangedEvent = null;
    main.exportExcel = null;
    main.checkClick = function () {
        main.List.forEach(function (value) {
            value.IsCheck = main.isCheck;
            value.updateMinMax(false);
        });
        main.gridConfigChanged("UpdateMinMax", main.getChangeModes());
        //main.isCheck = !main.isCheck;
    };
    main.currId = 0;
    main.reseizeWindow = function () {
        if ($(window).width() < 800) {
            $(".navbar-left,.navbar-right").hide();
            $("#navbar").hide();
            $("#top_container").hide();
            $("#rowTimeBtns").hide();
            $(".table_grid tr").each(function (item) {
                $("td:gt(4)", $(this)).hide();
                $("td:lt(1)", $(this)).hide();
            })
        } else {
            $(".navbar-left,.navbar-right").show();
            $("#rowTimeBtns").show();
            $("#navbar").show();
            $("#top_container").show();
            $(".table_grid tr").each(function (item) {
                $("td:gt(4)", $(this)).show();
                $("td:lt(1)", $(this)).show();
            })
        }
    };
    main.lineId = 0;
    main.init = function () {
        moment.locale("zh-cn");
        $('.datetimepicker').datetimepicker({
            locale: "zh-cn",
            format: "YYYY-MM-DD HH:mm:ss"
        });
        $('#ModalConfig').on('hidden.bs.modal', function (e) {
            if (main.preOpenModalIsReal) {
                main.realHisClass = "glyphicon glyphicon-stop";
                main.realHisColor = "btn btn-danger";
                main.updateRealOrHis(true);
            }
        });
    };
    main.loadData = function (data) {
        var search = $location.search();
        var isFixedLine = false;
        if (typeof (search.FixedLine) != "undefined") {
            isFixedLine = true;
        }
        if (typeof (search.Scale) != "undefined") {
            main.isCheck = search.Scale == 1;
        }
        else if (typeof (search.scale) != "undefined") {
            main.isCheck = search.Scale == 1;
        }
        for (var c in data) {
            if (typeof (data[c]).TagName == "undefined") {
                break;
            }
            var temp = new gridViewModel(main.lineId, data[c].Color, data[c].TagName, data[c].Text, data[c].Unit, data[c].Status, main.isCheck, data[c].Min, data[c].Max, data[c].TimeOffset, data[c].MinScale, data[c].MaxScale);
            temp.isExpressTag = data[c].ExpressTag;
            temp.isFormula = data[c].FormulaTag;
            temp.Formula = data[c].Formula;
            temp.Expression = data[c].Expression;
            temp.initOffset();
            main.List.push(temp);
            main.lineId++;
            if (isFixedLine) {
                temp.isFixedDisplay = true;
            }
        }
        if (typeof (search.FixedLine) != "undefined") {
            var fixedLineList = search.FixedLine.split('|');
            for (var c in fixedLineList) {
                if (fixedLineList[c].length > 0) {  //对于多个极限横轴 设置第一个 位号默认选中
                    main.List[c].isFixedLine = true;
                    break;
                }
            }
        }
    };
    main.maxId = 1000;
    main.setMinMaxValue = function (arr) {
        if (main.List.length === arr.length) {
            for (var c in arr) {
                ///当前绘图最大小值 自动计算绘图最大小值
                main.List[c].setMinMax(arr[c].MinValue, arr[c].MaxValue, arr[c].CompMin, arr[c].CompMax);
                // 设置当前的查询字段
                main.List[c].FieldValue = arr[c].FieldValue;
                main.List[c].Field = arr[c].Field;
                main.List[c].FieldType = arr[c].FieldType;
                main.List[c].RealMin = arr[c].RealMin.toFixed(3);
                main.List[c].RealMax = arr[c].RealMax.toFixed(3);
                main.List[c].AvgValue = arr[c].AvgValue.toFixed(3);
                main.List[c].changeModel.offsetValue = arr[c].OffsetValue;
            }
        }
    };
    main.getTagColor = null;
    main.addTag = function () {
        var color = main.getTagColor();
        var temp = new gridViewModel(main.maxId++, color, "", "", "", "", true, 0, 0, 0, 0, 100);
        temp.isInputTag = true;
        main.List.push(temp);
    };

    return main;
});