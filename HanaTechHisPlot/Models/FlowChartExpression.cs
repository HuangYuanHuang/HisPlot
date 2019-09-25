using System;
using System.Collections.Generic;
using System.Text;

/// <summary>
/// 共同类库-流程图公式处理类
/// </summary>
namespace HanaTechHisPlot.Models
{
    /// <summary>
    /// 流程图带公式的位号公式处理类
    /// </summary>
    public class HanatechExpression
    {
        /// <summary>
        /// 判断当前位号是否为公式位号
        /// </summary>
        /// <param name="strFlowChartExpression">位号表达式</param>
        /// <returns></returns>
        public static bool isExpTag(string strFlowChartExpression)
        {
            //如果位号包含“+”，“*”，“/”,“"”等特殊符号时，表示为公式位号
            if (strFlowChartExpression.IndexOfAny(new char[] { '+', '*', '/', '"','-' }) > 0)
            {
                return true;
            }

            return false;
        }

        /// <summary>
        /// 是否为操作符
        /// </summary>
        /// <param name="strExpOperator"></param>
        /// <returns></returns>
        public static bool isOperator(string strExpOperator)
        {
            if (strExpOperator == "+" || strExpOperator == "-" || strExpOperator == "*" || strExpOperator == "/")
            {
                return true;
            }

            return false;
        }

        /// <summary>
        /// 1、PHDXTB:(PHDXTB:FIC001 + PHDXTB:FIC002 + PHDXTB:FIC003) *0.2 + PHDFTB:FIC0004
        ///   返回:{PHDXTB,FIC001},{PHDXTB,FIC002},{PHDXTB,FIC003},{PHDFTB,FIC0004}
        /// 2、PHDXTB:FIC001*0.1
        ///   返回:{PHDXTB,FIC001}
        /// 3、PHDXTB:FIC001 + FIC002
        ///   返回:{PHDXTB,FIC001},{PHDXTB,FIC002}
        /// 4、PHDXTB:FIC001 + 4
        ///   返回:{PHDXTB,FIC001}
        /// </summary>
        /// <param name="strFlowChartExpression">流程图位号</param>
        /// <returns>公式包含的位号列表</returns>
        public static ExpHeadModel Run(string strFlowChartExpression)
        {
            ExpHeadModel modelHead = new ExpHeadModel();
            modelHead.ExpTagModel = new List<ExpTagModel>();
            ExpTagModel model = new ExpTagModel();

            string strCurrTagExp = "";  //当前表达式对象
            bool isFlag = false;        //进入引号模式

            //首先截取位号前缀，截取方式
            int nExpIndex = strFlowChartExpression.IndexOf(":");

            if (nExpIndex <= 0)
            {
                return modelHead;
            }

            //截取位号前缀
            modelHead.ExpHeadServerName = strFlowChartExpression.Substring(0, nExpIndex);
            modelHead.ExpHeadName = strFlowChartExpression.Substring(nExpIndex + 1);
            modelHead.ExpHeadFullName = strFlowChartExpression;

            for (int i = 0; i < modelHead.ExpHeadName.Length; i++)
            {
                string strExp = Convert.ToString(modelHead.ExpHeadName[i]);

                //if (strExp == "(" || strExp == ")")
                if (strExp == "(")
                {
                    continue;
                }

                //解决公式为：PHDLYB:FIC1001/(22+FIC1002)的场景
                if (strExp == ")" && isFlag == false && !string.IsNullOrEmpty(strCurrTagExp))
                {
                    AddTagModel(modelHead, strCurrTagExp);

                    //重新当前位号表达式
                    strCurrTagExp = "";

                    continue;
                }

                if (strExp == "\"")
                {
                    if (isFlag == false)
                    {
                        isFlag = true;
                    }
                    else
                    {
                        AddTagModel(modelHead, string.Format("{0}{1}", strCurrTagExp, strExp));

                        //重新当前位号表达式
                        strCurrTagExp = "";

                        isFlag = false;

                        continue;
                    }
                }

                //if (strExp == "+" || strExp == "-" || strExp == "*" || strExp == "/")
                if (isOperator(strExp))
                {
                    if (isFlag == false && !string.IsNullOrEmpty(strCurrTagExp))
                    {
                        AddTagModel(modelHead, strCurrTagExp);

                        //重新当前位号表达式
                        strCurrTagExp = "";

                        continue;
                    }
                    else if (isFlag == false && string.IsNullOrEmpty(strCurrTagExp))
                    {
                        continue;
                    }
                }

                strCurrTagExp += strExp;

                if (i == modelHead.ExpHeadName.Length - 1 && !string.IsNullOrEmpty(strCurrTagExp))
                {
                    AddTagModel(modelHead, strCurrTagExp);
                }
            }

            return modelHead;
        }

        /// <summary>
        /// 增加位号到队列
        /// </summary>
        /// <param name="modelHead"></param>
        /// <param name="strCurrTagExp"></param>
        /// <returns></returns>
        private static bool AddTagModel(ExpHeadModel modelHead, string strCurrTagExp)
        {
            //结束上一次表达式，并加入到队列中
            ExpTagModel model = new ExpTagModel();

            try
            {
                if (HanaTech.Lib.TypeParse.IsDouble(strCurrTagExp))
                {
                    return true;
                }

                int nCurrTagIndex = strCurrTagExp.IndexOf(":");

                if (nCurrTagIndex > 0)
                {
                    //如果当前位号有自定义位号前缀，那么获取本身的位号前缀
                    model.ExpServerName = strCurrTagExp.Substring(0, nCurrTagIndex).Trim();
                    model.ExpTagName = strCurrTagExp.Substring(nCurrTagIndex + 1).Trim();
                }
                else
                {
                    model.ExpServerName = modelHead.ExpHeadServerName.Trim();
                    model.ExpTagName = strCurrTagExp.Trim();
                }

                model.ExpTagKey = strCurrTagExp.Trim();

                modelHead.ExpTagModel.Add(model);
            }
            catch (Exception ex)
            {
                HanaTech.Lib.LogHelper.WriteLog(ex);
                return false;
            }

            return true;
        }
    }

    public class ExpHeadModel
    {
        private string expHeadServerName;

        public string ExpHeadServerName
        {
            get { return expHeadServerName; }
            set
            {

                expHeadServerName = value.Replace("(", "").Replace(")", "");
            }
        }



        public string ExpHeadName
        {
            get;
            set;
        }

        /// <summary>
        /// 默认表达式为FullName
        /// </summary>
        public string ExpHeadFullName
        {
            get;
            set;
        }

        public List<ExpTagModel> ExpTagModel
        {
            get;
            set;
        }
    }

    /// <summary>
    /// 表达式位号模型
    /// </summary>
    public class ExpTagModel
    {
        /// <summary>
        /// 位号Key，用于表达式替换
        /// </summary>
        public string ExpTagKey
        {
            get;
            set;
        }

        /// <summary>
        /// 位号服务名
        /// </summary>
        public string ExpServerName
        {
            get;
            set;
        }

        /// <summary>
        /// 位号名称
        /// </summary>
        public string ExpTagName
        {
            get;
            set;
        }

        /// <summary>
        /// 位号完整名称
        /// </summary>
        public string ExpFullName
        {
            get
            {
                return string.Format("{0}:{1}", ExpServerName, ExpTagName);
            }
        }

        /// <summary>
        /// 位号值
        /// </summary>
        public string ExpVal
        {
            get;
            set;
        }

        /// <summary>
        /// 位号时间
        /// </summary>
        public string ExpDate
        {
            get;
            set;
        }

        /// <summary>
        /// 可行度
        /// </summary>
        public string Confidence
        {
            get;
            set;
        }
    }
}
