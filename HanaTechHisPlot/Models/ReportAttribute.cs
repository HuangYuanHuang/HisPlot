using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DoddleReport;
namespace HanaTechHisPlot.Models
{
    #region Attribute



    [System.AttributeUsage(System.AttributeTargets.Property, Inherited = false, AllowMultiple = true)]
    sealed class DisplayNameAttribute : Attribute
    {

        readonly string positionalString;

        // This is a positional argument
        public DisplayNameAttribute(string name)
        {
            this.positionalString = name;


        }

        public string Name
        {
            get { return positionalString; }
        }


    }
    [System.AttributeUsage(AttributeTargets.Property, Inherited = false, AllowMultiple = true)]
    sealed class IsTotalAttribute : Attribute
    {
        // See the attribute guidelines at 
        //  http://go.microsoft.com/fwlink/?LinkId=85236

        public IsTotalAttribute()
        {

        }

        public bool IsTotals
        {
            get { return true; }
        }


    }

    #endregion

    public static class ModelExcept
    {
        public static Report ListViewModelToReport<T>(this List<T> list)
        {
            var report = new Report(list.ToReportSource());
            foreach (var item in typeof(T).GetProperties())
            {

                Object[] myAttributes = item.GetCustomAttributes(true);
                if (myAttributes.Length > 0)
                {
                    
                    foreach (var itemAtt in myAttributes)
                    {
                        if (itemAtt.GetType() == typeof(IsTotalAttribute))
                        {
                            report.DataFields[item.Name].ShowTotals = true;
                        }
                       
                        else 
                        {
                            report.DataFields[item.Name].HeaderText = (itemAtt as DisplayNameAttribute).Name+"                                     ";
                        }
                    }
                }
                else
                {
                    report.DataFields[item.Name].Hidden = true;
                }
            }

            return report;
        }
    }

}
