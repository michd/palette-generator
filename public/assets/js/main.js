(function () {
  var colorsTextArea = document.getElementById("colors-textarea"),
      generateButton = document.getElementById("generate-button"),
      paletteSection = document.getElementById("palette-section"),
      codeOutputTypeSelect = document.getElementById("code-output-type-select"),
      outputCodeTextArea = document.getElementById("output-code-textarea"),
      
      parsedColors = [];
  
  generateButton.addEventListener("click", generatePalette);
  codeOutputTypeSelect.addEventListener("change", generateCode);
  
  function toggleVisible(elem, visible) {
    elem.classList.toggle("hidden", !visible);
  }
  
  function parse(rawLine) {
    var colorPattern = /^(#[0-9a-fA-F]{6})(?:(?:\s+)([a-zA-Z0-9\_]+))?(?:(?:\s+)(.*))?/;
    var matches = rawLine.match(colorPattern);
    
    if (!matches) {
      return null;
    }
    
    return {
      hex: matches[1].toUpperCase(),
      name: matches[2],
      comment: matches[3]
    };
  }
  
  function generatePalette() {
    var lines = colorsTextArea.value.match(/[^\r\n]+/g) || [],
        parsedColor,
        i;

    parsedColors = [];
    
    for (i = 0; i < lines.length; i++) {
      parsedColor = parse(lines[i]);
      if (parsedColor !== null) {
        parsedColors.push(parsedColor);
      }
    }
    
    buildSwatches();
    generateCode();
  }
  
  function buildSwatches() {
    var COLUMNS = 3,
        totalColors = parsedColors.length,
        maxPerColumn = Math.ceil(totalColors / COLUMNS),
        inCurrentColumn = 0,
        swatchesHtml = "";
    
    swatchesHtml += "<div class=\"color-column\">";
    
    for (var i = 0; i < totalColors; i++) {      
      if (inCurrentColumn == maxPerColumn) {
        swatchesHtml += "</div><div class=\"color-column\">";
        inCurrentColumn = 0;
      }
      
      swatchesHtml += createSwatch(parsedColors[i]);
      inCurrentColumn++;
    }
    
    swatchesHtml += "</div>";
    
    paletteSection.innerHTML = swatchesHtml;
    
    toggleVisible(paletteSection, totalColors > 0);
  }
  
  function createSwatch(color) {
    return "<div class=\"color-block\">" +
      "<div class=\"color-block--color\" style=\"background-color: " + color.hex + ";\"></div>" +
      "<div class=\"color-block--description\">" + 
      color.name + "<br>" + color.hex + "<br>" +
      "<span>" + (color.comment || "") + "</span>" +
      "</div>" +
      "</div>";
  }
  
  function generateCode() {
    var codeType = codeOutputTypeSelect.value,
        i,
        output = "";
    
    for (i = 0; i < parsedColors.length; i++) {
      console.log(generateCodeForColor(parsedColors[i], codeType));
      output += generateCodeForColor(parsedColors[i], codeType) + "\n";
    }
    
    outputCodeTextArea.innerHTML = output;
  }
  
  function generateCodeForColor(color, codeType) {
    var CODETYPE_ANDROID = "android",
        CODETYPE_XAMARIN_IOS = "xamarin-ios",
        CODETYPE_SCSS = "scss";
        
    switch (codeType) {
      case CODETYPE_ANDROID:
        return (function () {
          var template = "&lt;color name=\"pc_{colorName}\"&gt;{hex}&lt;/color&gt;{note}",
              noteTemplate = " &lt;!-- Note: {comment} --&gt;",
              note = "";
          
          if (color.comment) {
            note = noteTemplate.replace("{comment}", color.comment);
          }
          
          return template.replace("{colorName}", color.name)
            .replace("{hex}", color.hex)
            .replace("{note}", note);                        
        }());
        
      case CODETYPE_XAMARIN_IOS:
        return (function () {
          //var pcGrey1 = UIColor.FromRGBA(0xdb, 0xdb, 0xdb, 0xdb); // Light background
          var template = "var pc{colorName} = UIColor.FromRGBA(0x{hexR}, 0x{hexG}, 0x{hexB}, 0xff);{note}",
              noteTemplate = " // {comment}",
              hexR = color.hex.substr(1, 2).toLowerCase(),
              hexG = color.hex.substr(3, 2).toLowerCase(),
              hexB = color.hex.substr(5, 2).toLowerCase(),
              note =  color.comment ? noteTemplate.replace("{comment}", color.comment) : "";
          
          function camelCase(name) {
            var parts = name.split("_"),
                output = "";
            
            for (var i = 0; i < parts.length; i++) {
              output += parts[i][0].toUpperCase() + parts[i].substr(1);
            }
            
            return output;
          }
          
          return template.replace("{colorName}", camelCase(color.name))
            .replace("{hexR}", hexR)
            .replace("{hexG}", hexG)
            .replace("{hexB}", hexB)
            .replace("{note}", note);
        }());
       
      case CODETYPE_SCSS:
        return (function () {
          var template = "$c-{colorName}: {hex};{note}",
              noteTemplate = " // {comment}",
              note = color.comment ? noteTemplate.replace("{comment}", color.comment) : "",
              colorName = color.name.replace("_", "-");

          return template.replace("{colorName}", colorName)
            .replace("{hex}", color.hex)
            .replace("{note}", note);
        }());
        
      default:
        throw new Error("No such code type");
        break;
    }
  }
}());
