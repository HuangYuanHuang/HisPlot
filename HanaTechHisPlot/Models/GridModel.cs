using System;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using HanaTechHisPlot.HanaTechWCFService;

namespace HanaTechHisPlot.Models
{
    public class BaseWcfModel
    {
        protected static string[] DefaultColors = { "#0066dd", "#990000", "#008000", "#800080", "#998000", "#000000", "#00ced1",
            "#fa8072", "#92eq06", "#cc0066", "#008080", "#663300","#00008b","#00cc00","#b22222","#00cccc" };
        WCFAspenClient wcfAspen;

        protected WCFAspenClient WcfClient
        {
            get
            {
                if (wcfAspen == null || wcfAspen.State == System.ServiceModel.CommunicationState.Closed
                    || wcfAspen.State == System.ServiceModel.CommunicationState.Closing || wcfAspen.State == System.ServiceModel.CommunicationState.Faulted)
                {
                    wcfAspen = new WCFAspenClient();
                }

                return wcfAspen;
            }
        }

        public void Close()
        {
            if (WcfClient != null)
            {
                WcfClient.Close();
            }
        }
    }

    public class GridModel : BaseWcfModel
    {
        public string TagName { get; set; }
        public string Color { get; set; }
        public int Width { get; set; }
        public string Text { get; set; }
        public string Unit { get; set; }
        public string Status { get; set; }
        public double Min { get; set; }
        public double Max { get; set; }
        public string Field { get; set; }
        public int FieldValue { get; set; }
        public string FieldType { get; set; }
        public double MinScale { get; set; }
        public double MaxScale { get; set; }

        public bool ExpressTag { get; set; }

        public bool FormulaTag { get; set; }

        public FormulaNode Formula { get; set; }

        public ExpressionNode Expression { get; set; }
        /// <summary>
        /// 时间偏移量
        /// </summary>
        public int TimeOffset { get; set; }


        public async Task<List<GridModel>> LoadGrids(List<QueryModel> query, bool isRandom)
        {
            List<GridModel> listRes = new List<GridModel>();
            await Task.Delay(10);
            int index = 0;
            foreach (var item in query)
            {
                var node = new GridModel()
                {
                    Color = item.Color?.Length < 1 ? DefaultColors[index] : item.Color,
                    TagName = item.TagName,
                    Text = "",
                    Unit = "",
                    Status = "",
                    Width = item.Width,
                    Max = item.Max,
                    Min = item.Min,
                    Field = item.Field,
                    FieldType = item.FieldType,
                    FieldValue = item.FieldValue,
                    TimeOffset = item.OffsetValue,
                    MaxScale = item.MaxScale >= 99999 ? Convert.ToDouble("100") : item.MaxScale,
                    MinScale = item.MinScale <= -99999 ? Convert.ToDouble("0") : item.MinScale
                };
                listRes.Add(node);
                index++;
            }
            return listRes;

        }
        public async Task<List<GridModel>> LoadGrids(List<QueryModel> query)
        {
            List<TagProperty> list = null;
            try
            {
                list = await Task<List<TagProperty>>.Factory.FromAsync(WcfClient.BeginFetchDataByTagPropertyList,
                                 WcfClient.EndFetchDataByTagPropertyList, query.QueryModelToQueryTags(), null);
            }
            catch (Exception ex)
            {
                throw new Exception($"WCF获取数据ERROR:{ex.Message}");
            }
            List<GridModel> listRes = new List<GridModel>();
            if (list != null && list.Count > 0)
            {
                int index = 0;

                foreach (var item in query)
                {
                    var tag = list.FirstOrDefault(d => d.位号名称 == item.TagName) ?? new TagProperty();

                    var node = new GridModel()
                    {
                        Color = item.Color?.Length < 1 ? DefaultColors[index] : item.Color,
                        TagName = item.TagName,
                        Text = tag.描述 ?? "",
                        Unit = tag.ENG_UNITS ?? "",
                        Status = tag.DC_STATUS ?? "",
                        Width = item.Width,
                        Max = item.Max,
                        Min = item.Min,
                        Field = item.Field,
                        FieldType = item.FieldType,
                        FieldValue = item.FieldValue,
                        FormulaTag = item.IsFormula,
                        ExpressTag = item.IsExpression,
                        Expression = item.Expression,
                        Formula = item.Formula,
                        TimeOffset = item.OffsetValue,
                        MaxScale = (string.IsNullOrEmpty(tag.GRAPH_MAXIMUM) ? 100 : item.MaxScale >= 99999 ? Convert.ToDouble(tag.GRAPH_MAXIMUM?.Length < 1 ? "100" : tag.GRAPH_MAXIMUM) : item.MaxScale),
                        MinScale = item.MinScale <= -99999 ? Convert.ToDouble(tag.GRAPH_MINIMUM?.Length < 1 ? "0" : tag.GRAPH_MINIMUM) : item.MinScale
                    };
                    listRes.Add(node);
                    index++;
                }

            }
            else
            {
                foreach (var item in query)
                {

                    var node = new GridModel()
                    {
                        Color = item.Color?.Length < 1 ? DefaultColors[listRes.Count] : item.Color,
                        TagName = item.TagName,
                        Text = "",
                        Unit = "",
                        Status = "",
                        Width = item.Width,
                        Max = item.Max,
                        Min = item.Min,
                        Field = item.Field,
                        FieldType = item.FieldType,
                        FieldValue = item.FieldValue,
                        TimeOffset = item.OffsetValue,
                        ExpressTag = item.IsExpression,
                        Expression = item.Expression,
                        MaxScale = item.MaxScale >= 99999 ? 100 : item.MaxScale,
                        MinScale = item.MinScale <= -99999 ? 0 : item.MinScale
                    };
                    listRes.Add(node);
                }
            }

            return listRes;
        }
    }
}