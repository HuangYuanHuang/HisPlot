using System;

namespace HanaTechHisPlot.Models
{
    public class QueryModel
    {
        public string TagName { get; set; }

        public string Start { get; set; }

        public string End { get; set; }

        public string Color { get; set; }

        public int Width { get; set; }

        public bool Display { get; set; }

        public string Field { get; set; }

        public bool IsExpression { get; set; }

        public bool IsFormula { get; set; }

        public FormulaNode Formula { get; set; }

        public ExpressionNode Expression { get; set; }

        public bool IsError { get; set; }
        public int FieldValue { get; set; }

        public string FieldType { get; set; }

        public double Min { get; set; }

        public double Max { get; set; }

        /// <summary>
        /// 是否自动计算绘图最大小值
        /// </summary>
        public bool AutoMinMax { get; set; }

        public int OffsetValue { get; set; }

        public double MinScale { get; set; }

        public double MaxScale { get; set; }

        public override string ToString() => $"{TagName}|{Start}|{End}";
    }


    public class FormulaNode
    {
        public string TagName { get; set; }

        public string Operation { get; set; }

        public string Value { get; set; }
    }

    public class ExpressionNode
    {
        public string Left { get; set; }

        public string Compare { get; set; }

        public string Right { get; set; }

        public string LeftAck { get; set; }

        public string RightAck { get; set; }
    }
}