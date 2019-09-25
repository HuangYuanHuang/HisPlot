
using System.Collections.Generic;
using System.Linq;


namespace HanaTechHisPlot.Models
{
    public static class QueryModelExpand
    {
        public static List<string> QueryModelToQueryTags(this IEnumerable<QueryModel> list)
        {
            var query = list.ToList();
            HashSet<string> hasSet = new HashSet<string>();

            foreach (var item in query.Where(d => !(d.IsFormula || d.IsExpression)))
            {
                hasSet.Add(item.TagName);
            }


            return hasSet.ToList();
        }




    }



}