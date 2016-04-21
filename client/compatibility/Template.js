/**********************************************************
<Summary>
  <Name>Template</Name>
  <Description>Make template to html</Description>
</Summary>
***********************************************************/
Template = {
  toHtml: function(template, data, dataWrapperStartSign, dataWrapperEndSign) {
    "use strict";
    var returnTemplate = template;
    var dataStartSign = dataWrapperStartSign || '{{';
    var dataEndSign = dataWrapperEndSign || '}}';

    while(true){
      if(returnTemplate.length>0){
        var str = returnTemplate;
        var n1 = str.indexOf(dataStartSign);
        var n2 = str.indexOf(dataEndSign);
        if (n1 == -1 || n2 == -1 || n1>=n2) {
          break;
        }
        else{
          var varibale = str.substr(n1, n2 - n1 + 2);
          var key = (str.substr(n1 + 2, n2 - n1 - 2)).trim();

          if (data.hasOwnProperty(key)) {
            var value = data[key];
            returnTemplate = returnTemplate.replace(varibale, value);
          } else {
            throw Error("invalid key : " + varibale);
          }
        }
      }
      else {
        break;
      }
    }
    return returnTemplate;
  }
}
