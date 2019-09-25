using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace HanaTechHisPlot.Models
{
    public class QueryParamService<T> where T : IQueryParam, new()
    {
        public List<T> GetQueryParams(List<QueryModel> listParam)
        {
            List<T> query = new List<T>();

            foreach (var item in listParam)
            {
                var temp = new T
                {
                    位号名称 = item.TagName
                };
                if (item.Start?.Length > 5)
                {
                    temp.开始日期 = DateTime.Parse(item.Start).AddSeconds(item.OffsetValue).ToString("yyyy-MM-dd HH:mm:ss");
                    temp.结束日期 = DateTime.Parse(item.End).AddSeconds(item.OffsetValue).ToString("yyyy-MM-dd HH:mm:ss");
                }
                else
                {
                    temp.开始日期 = DateTime.Now.AddMinutes(-120).AddSeconds(item.OffsetValue).ToString("yyyy-MM-dd HH:mm:ss");
                    temp.结束日期 = DateTime.Now.AddSeconds(item.OffsetValue).ToString("yyyy-MM-dd HH:mm:ss");
                }
                if (item.FieldValue > 0)
                {
                    temp.字段 = item.Field;
                    temp.周期 = item.FieldValue * Convert.ToInt32(item.FieldType);
                }
                item.Start = temp.开始日期;
                item.End = temp.结束日期;
                item.IsExpression = item.Expression != null;
                item.IsFormula = HanatechExpression.isExpTag(item.TagName) && item.Expression == null;

                if (item.IsExpression || item.IsFormula)
                {
                    var listTagModel = new List<ExpTagModel>();
                    if (item.IsExpression)
                    {
                        listTagModel.AddRange(HanatechExpression.Run(item.Expression.Left).ExpTagModel);
                        listTagModel.AddRange(HanatechExpression.Run(item.Expression.Right).ExpTagModel);
                        listTagModel.AddRange(HanatechExpression.Run(item.Expression.LeftAck).ExpTagModel);
                        listTagModel.AddRange(HanatechExpression.Run(item.Expression.RightAck).ExpTagModel);

                    }
                    else
                    {
                        listTagModel = HanatechExpression.Run(item.TagName).ExpTagModel;

                    }
                    listTagModel.ForEach(d =>
                    {
                        query.Add(new T()
                        {
                            位号名称 = $"{d.ExpFullName.Replace("\"", "")}",
                            开始日期 = temp.开始日期,
                            结束日期 = temp.结束日期,
                            字段 = temp.字段,
                            周期 = temp.周期

                        });
                    });
                }
                else
                {
                    query.Add(temp);

                }
            }


            var queryList = query.Distinct(new QueryParamComparer<T>()).ToList();

            return query;
        }
    }
    // ASPENDCS:(ASPENDCS:BJF_A1MK110_ST+ASPENDCS:BJF_A1MK111_ST)*0.2+ASPENDCS:BJF_A1MK109_ST
    public class QueryDataWebService<T> where T : ITagValueList
    {

        Func<Task<Dictionary<string, List<T>>>> serviceAction;
        List<QueryModel> listParam;
        Dictionary<string, string> tagDictionMap;

        string[] DefaultColors = { "#0066dd", "#990000", "#008000", "#800080", "#998000", "#000000", "#00ced1",
            "#fa8072", "#92eq06", "#cc0066", "#008080", "#663300","#00008b","#00cc00","#b22222","#00cccc" };

        Dictionary<string, bool> MapColor = new Dictionary<string, bool>();
        public QueryDataWebService(Func<Task<Dictionary<string, List<T>>>> _serviceAction, List<QueryModel> _listParam)
        {
            serviceAction = _serviceAction;
            listParam = _listParam;
            DefaultColors.ToList().ForEach(d => MapColor.Add(d, false));
        }

        private async Task<DataTable> GetQueryDataTable()
        {
            tagDictionMap = new Dictionary<string, string>();
            Dictionary<string, List<T>> list = await serviceAction();
            DataTable dt = new DataTable();
            int index = 0;
            int rowIndex = 0;
            int maxRow = 0;
            string maxKey = "";
            dt.Columns.Add(new DataColumn
            {
                ColumnName = "ID",
                Caption = "序号",
                DataType = typeof(Int64)
            });
            foreach (var item in list.Keys)
            {
                if (!tagDictionMap.ContainsKey(item))
                {
                    tagDictionMap.Add(item, $"RX{index}");
                    dt.Columns.Add(new DataColumn
                    {
                        ColumnName = $"TagName_RX{index}",
                        Caption = $"TagName_{item}",
                        DataType = typeof(double)
                    });
                    dt.Columns.Add(new DataColumn
                    {
                        ColumnName = $"Time_RX{index}",
                        Caption = $"Time_{item}",
                        DataType = typeof(string)
                    });
                    dt.Columns.Add(new DataColumn
                    {
                        ColumnName = $"Confidence_RX{index}",
                        Caption = $"Confidence_{item}",
                        DataType = typeof(string)
                    });
                    index++;
                }
            }

            Func<QueryModel, string, string> getTagFormula = (model, s) =>
             {
                 var listTagModel = HanatechExpression.Run(s).ExpTagModel;
                 foreach (var item in listTagModel)
                 {
                     s = s.Replace(item.ExpServerName + ":", "");
                     var key = tagDictionMap.Keys.FirstOrDefault(d => d.Contains($"{item.ExpTagName.Replace("\"", "")}|{model.Start}|{model.End}"));
                     s = s.Replace(item.ExpTagName, key);
                     if (!string.IsNullOrEmpty(key))
                     {
                         s = s.Replace(key, "TagName_" + tagDictionMap[key]);

                     }
                 }
                 return s;
             };
            Func<QueryModel, string> getTagExpression = (s) =>
            {
                string res = $"IIF({getTagFormula(s, s.Expression.Left)} {s.Expression.Compare.Replace("==", "=")} {getTagFormula(s, s.Expression.Right)} ";
                res += $",{getTagFormula(s, s.Expression.LeftAck)} ,{getTagFormula(s, s.Expression.RightAck)})";
                return res;
            };
            index = 0;
            foreach (var item in listParam)
            {
                if (item.IsFormula)
                {
                    try
                    {
                        dt.Columns.Add(new DataColumn
                        {
                            ColumnName = $"Formula_RX{index}",
                            Caption = $"{item.TagName}",
                            DataType = typeof(double),
                            Expression = getTagFormula(item, item.TagName)
                        });
                    }
                    catch (Exception)
                    {
                        dt.Columns.Add(new DataColumn
                        {
                            ColumnName = $"Formula_RX{index}",
                            Caption = $"{item.TagName}",
                            DataType = typeof(double),
                            Expression = "IIF(1=0,0,0)"
                        });
                        item.IsError = true;
                    }


                    dt.Columns.Add(new DataColumn
                    {
                        ColumnName = $"FormulaTime_RX{index}",
                        Caption = $"FormulaTime_{index}",
                        DataType = typeof(string)
                    });
                    dt.Columns.Add(new DataColumn
                    {
                        ColumnName = $"FormulaConfidence_RX{index}",
                        Caption = $"FormulaConfidence_{index++}",
                        DataType = typeof(string)
                    });
                }
                if (item.IsExpression)
                {
                    // IIF(TagA + 1 > TagB, TagA, 666)
                    try
                    {
                        dt.Columns.Add(new DataColumn
                        {
                            ColumnName = $"Expression_RX{index}",
                            Caption = $"{item.TagName}",
                            DataType = typeof(double),
                            Expression = getTagExpression(item)
                        });
                    }
                    catch (Exception)
                    {

                        dt.Columns.Add(new DataColumn
                        {
                            ColumnName = $"Expression_RX{index}",
                            Caption = $"{item.TagName}",
                            DataType = typeof(double),
                            Expression = "IIF(1=0,0,0)"
                        });
                        item.IsError = true;

                    }

                    dt.Columns.Add(new DataColumn
                    {
                        ColumnName = $"ExpressionTime_RX{index}",
                        Caption = $"ExpressionTime_{index}",
                        DataType = typeof(string)
                    });
                    dt.Columns.Add(new DataColumn
                    {
                        ColumnName = $"ExpressionConfidence_RX{index}",
                        Caption = $"ExpressionConfidence_{index++}",
                        DataType = typeof(string)
                    });
                }
            }

            foreach (var item in list)
            {
                if (maxRow < list[item.Key].Count)
                {
                    maxKey = item.Key;
                    maxRow = list[item.Key].Count;
                }
            }
            if (!list.ContainsKey(maxKey))
            {
                return dt;
            }
            foreach (var item in list[maxKey])
            {
                DataRow dr = dt.NewRow();
                dr["ID"] = rowIndex++;
                dt.Rows.Add(dr);
            }

            foreach (var item in list)
            {
                var datas = list[item.Key];
                int dataIndex = 0;
                foreach (var d in datas)
                {
                    string drKey = tagDictionMap[item.Key];
                    dt.Rows[dataIndex][$"TagName_{drKey}"] = d.位号值;
                    dt.Rows[dataIndex][$"Time_{drKey}"] = d.位号值时间;
                    dt.Rows[dataIndex++][$"Confidence_{drKey}"] = d.可信度;
                }
            }
            List<int> listColumn = new List<int>();
            for (int i = 0; i < dt.Columns.Count; i++)
            {
                if (dt.Columns[i].ColumnName.Contains("FormulaTime_RX") || dt.Columns[i].ColumnName.Contains("ExpressionTime_RX"))
                {
                    listColumn.Add(i);
                }
            }
            string maxDrkey = tagDictionMap[maxKey];
            foreach (var item in listParam.Where(d => d.IsExpression || d.IsFormula))
            {

                foreach (DataRow dr in dt.Rows)
                {
                    listColumn.ForEach(d =>
                    {
                        dr[d] = dr[$"Time_{maxDrkey}"];

                    });
                }
            }


            return dt;

        }


        public async Task<MainCanvasModel> GetMainCanvasModel()
        {
            var dataTable = await GetQueryDataTable();
            List<LineModel> listRes = new List<LineModel>();
            int index = 0;
            foreach (var item in MapColor.Keys.ToList())
            {
                MapColor[item] = false;
            }
            Func<string> getColor = () =>
            {
                var obj = MapColor.First(d => !d.Value);
                MapColor[obj.Key] = true;
                return obj.Key;
            };
            foreach (var item in listParam)
            {
                var key = item.ToString();
                if (!(tagDictionMap.ContainsKey(key) || item.IsExpression || item.IsFormula))
                {
                    continue;
                }
                if (index++ > DefaultColors.Length - 1)
                {
                    break;
                }
                var color = string.IsNullOrEmpty(item.Color) ? getColor() : item.Color;
                var temp = new LineModel()
                {
                    Display = item.Display,
                    Width = item.Width,
                    OffsetValue = item.OffsetValue,
                    TagName = item.TagName,
                    Field = item.Field,
                    FieldType = item.FieldType,
                    FieldValue = item.FieldValue,
                    AutoMinMax = item.AutoMinMax,
                    Color = color,
                };

                Func<string, List<LineDataNode>> getLineDataNodes = (k) =>
                {
                    string mapKey = tagDictionMap[k];
                    List<LineDataNode> lineDatas = new List<LineDataNode>();
                    for (int i = 0; i < dataTable.Rows.Count; i++)
                    {
                        var tempValue = dataTable.Rows[i][$"TagName_{mapKey}"].ToString();
                        if (string.IsNullOrEmpty(dataTable.Rows[i][$"Time_{mapKey}"].ToString()) || string.IsNullOrEmpty(tempValue))
                        {
                            continue;
                        }
                        lineDatas.Add(new LineDataNode()
                        {
                            Time = DateTime.Parse(dataTable.Rows[i][$"Time_{mapKey}"].ToString()).ToString("yyyy-MM-dd HH:mm:ss"),

                            //      Time = DateTime.Parse(dataTable.Rows[i][$"Time_{mapKey}"].ToString()).AddSeconds(-item.OffsetValue).ToString("yyyy-MM-dd HH:mm:ss"),
                            ValueStr = tempValue,
                            Confidence = dataTable.Rows[i][$"Confidence_{mapKey}"].ToString()

                        });
                    }

                    return lineDatas;
                };
                if (tagDictionMap.ContainsKey(key))
                {
                    temp.Data = getLineDataNodes(key);
                }
                else if (item.IsExpression || item.IsFormula)
                {
                    var tagValueIndex = 0;
                    var timeValueIndex = 0;
                    var cofidenceIndex = 0;
                    for (int i = 0; i < dataTable.Columns.Count; i++)
                    {
                        if (dataTable.Columns[i].Caption == item.TagName)
                        {

                            tagValueIndex = i;
                        }


                    }
                    string replcaeTag = item.IsExpression ? "Expression" : "Formula";
                    string columnName = dataTable.Columns[tagValueIndex].ColumnName;
                    string tagMark = columnName.Replace($"{replcaeTag}_RX", "");
                    for (int i = 0; i < dataTable.Columns.Count; i++)
                    {

                        if (dataTable.Columns[i].Caption == $"{replcaeTag}Time_{tagMark}")
                        {
                            timeValueIndex = i;
                        }
                        if (dataTable.Columns[i].Caption == $"{replcaeTag}Confidence_{tagMark}")
                        {
                            cofidenceIndex = i;
                        }

                    }
                    List<LineDataNode> lineDatas = new List<LineDataNode>();
                    for (int i = 0; i < dataTable.Rows.Count; i++)
                    {
                        var tempValue = dataTable.Rows[i][tagValueIndex].ToString();

                        if (string.IsNullOrEmpty(dataTable.Rows[i][timeValueIndex].ToString()) || string.IsNullOrEmpty(tempValue))
                        {
                            continue;
                        }
                        lineDatas.Add(new LineDataNode()
                        {
                            Time = DateTime.Parse(dataTable.Rows[i][timeValueIndex].ToString()).ToString("yyyy-MM-dd HH:mm:ss"),
                            ValueStr = tempValue,
                            Confidence = dataTable.Rows[i][cofidenceIndex].ToString()

                        });
                    }
                    temp.Data = lineDatas;

                }
                temp.SetMinMaxValue(item.AutoMinMax, item.Min, item.Max);
                if (item.IsError)
                {
                    temp.CompMin = 0;
                    temp.CompMax = 0;
                    temp.Data = new List<LineDataNode>();
                    temp.MaxValue = 0f;
                    temp.MinValue = 0f;
                }
                listRes.Add(temp);
            }

            index = 0;
            foreach (var item in listParam)
            {
                item.Start = DateTime.Parse(item.Start).AddSeconds(-item.OffsetValue).ToString();
                item.End = DateTime.Parse(item.End).AddSeconds(-item.OffsetValue).ToString();
            }

            var resMain = new MainCanvasModel()
            {
                StartTime = listParam.Min(d => d.Start),
                EndTime = listParam.Max(d => d.End),
                Lines = listRes
            };
            return resMain;
        }
    }
}