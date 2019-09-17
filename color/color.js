/**
 * @param {String[]} shades      - an array of strings representing colors in a gradient (from dark to light)
 * @param {Number=} [lowerb=0.3] - a number from 0 to 1 representing the lower bound percent to trim the gradient to (for fine tuning)
 * @param {Number=} [upperb=0.7] - a number from 0 to 1 representing the upper bound percent to trim the gradient to (for fine tuning)
 * @example
 *
 *     var red = new Color(['#730013','#eb435f','#fcc7d0']),
 */
function Color(shades, lowerb, upperb){

    this.shadow = shades[0];
    this.midtone = shades[Math.floor(shades.length / 2)];
    this.highlight = shades[shades.length - 1]

    var parsedShades = [];

    for (var shade of shades){
        parsedShades.push(parseColor(shade));
    }
    function parseColor(colorString){
        try{
            if (colorString.includes("#")){
                return hex2rgb(colorString);
            }else 
            if(colorString.includes("rgb")){
                return rgb2obj(colorString)
            }else{
                throw colorString;
            }
        }catch(e){
            console.error("invalid color or unsupported type: ", e);
        }
    }
    function rgb2obj(rgb){
        var arr = rgb.substr(rgb.indexOf("(") + 1).split(",");
        var color = {
            r: parseFloat(arr[0]),
            g: parseFloat(arr[1]),
            b: parseFloat(arr[2]),
        }
        if (typeof arr[3] != 'undefined'){
            color.a = parseFloat(arr[3]);
        }else{
            color.a = 1;
        }

        return color;
    }
    function hex2rgb(hex) {
        var m = hex.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
        return {
            r: parseInt(m[1], 16),
            g: parseInt(m[2], 16),
            b: parseInt(m[3], 16),
            a: 1,
        };
    }
    function mapScale(num, in_min, in_max, out_min, out_max){
        return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    }
    
    //given a percentage, returns the rgba color at that point on linear gradient between the supplied colors. 
    function getColorForShade(alpha) {
        var endIndex = parsedShades.length - 1,
            where = alpha * endIndex,
            i = Math.ceil(where) || 1;
            if (i >= parsedShades.length) i = endIndex;
            //the 2 colors on the gradient that we fall between are [i] and [i - 1].
            //once we have determined i, we now need to find how much of each color we need to mix.
        var lower = parsedShades[i - 1], 
            upper = parsedShades[i], 
            lowerPct = (i - 1) / endIndex, 
            upperPct = i / endIndex, 
            range = upperPct - lowerPct, 
            rangePct = (alpha - lowerPct) / range, 
            pctLower = 1 - rangePct, 
            pctUpper = rangePct,
            //pctLower and pctUpper determine the amount of each color we need to mix, respectively. 
            color = {
                r: Math.floor(lower.r * pctLower + upper.r * pctUpper),
                g: Math.floor(lower.g * pctLower + upper.g * pctUpper),
                b: Math.floor(lower.b * pctLower + upper.b * pctUpper),
                a: lower.a * pctLower + upper.a * pctUpper,
            };
        return 'rgb(' + [color.r, color.g, color.b, color.a].join(',') + ')';
    }

    function toString(){
        return this.midtone;
    }
    this.toString = toString.bind(this);

    //This function returns an object with a toString() method,
    // so that zDog stores the object instead of a string value,
    // so that its value can change each time zDog goes to render the object.
    // ie. `shape.color = red.shadeByDepth(this)` will return the correct shade
    // based on the depth at each frame without needing to manually be called in animate().
    //This does not work on shapes with colors selected manually such as with .highlight or .shadow.
    //The reverse parameter, if true, will flip the gradient output for that part.
    function shadeByDepth(zdogObj, reverse){
        return {
            minZ: 100,
            maxZ: 100,
            toString: function(){
                if (zdogObj && zdogObj.sortValue){       
                    return this.adjustColor(zdogObj.sortValue, reverse);
                }else{
                    console.log("shadeByDepth(): no sortValue found: ", zdogObj);
                    return "red";
                }
            },
            adjustColor: function(sortValue, reverse){
                if (sortValue > this.maxZ) this.maxZ = sortValue;
                if (sortValue < this.minZ) this.minZ = sortValue;
                var upper = 0.7, //how bright the lighting goes (closer to 1)
                    lower = 0.3; //how dark the lighting goes (closer to 0)
                if (typeof upperb != 'undefined') upper = upperb;
                if (typeof lowerb != 'undefined') lower = lowerb;
                var percent = mapScale(sortValue, this.minZ, this.maxZ, (reverse? upper : lower), (reverse? lower : upper));
                var adjustedColor = getColorForShade(percent);
                return adjustedColor;
            },
            //for reference in logging only
            shades: shades,
            parsedShades: parsedShades
        }
    }
    this.shadeByDepth = shadeByDepth.bind(this);
} 

var red = new Color([],)