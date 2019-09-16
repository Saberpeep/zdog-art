document.addEventListener('DOMContentLoaded', function(){
    var TAU = Zdog.TAU,
        canvas = document.querySelector('.zdog-canvas'),
        spinning = true,
        spinningTimeout;

    let illo = new Zdog.Illustration({
        element: '.zdog-canvas',
        dragRotate: true,
        onDragStart: function(){
            clearTimeout(spinningTimeout);
            spinning = false;
        },
        onDragEnd: function(){
            clearTimeout(spinningTimeout);
            spinningTimeout = setTimeout(function(){
                spinning = true;
            }, 2000)
        },
        zoom: 0.8,
        rotate: { x: -TAU / 16, y: -TAU / 8 },
    });
    var birb = new Birb({
        addTo: illo,
        translate: { y: -100 },
    });

    window.birb = birb;
    console.log("birb:", birb);

    canvas.addEventListener('wheel', function(e){
        e.preventDefault();
        var zoom = illo.zoom
        zoom -= e.deltaY / 1000;
        if (zoom < 0.1){
            zoom = 0.1;
        }
        illo.zoom = zoom;
    }, false);

    function Birb(options){

        var flipAxis = 'x';

        function Color(baseColor, highlightColor, shadowColor){
            this.base = baseColor;
            this.highlight = highlightColor || baseColor;
            this.shadow = shadowColor || baseColor;

            var shades = [];

            if(shadowColor){
                shades.push(parseColor(shadowColor));
            }
            if(baseColor){
                shades.push(parseColor(baseColor));
            }
            if(highlightColor){
                shades.push(parseColor(highlightColor));
            }
            function parseColor(colorString){
                try{
                    if (colorString.includes("#")){
                        return hex2rgb(colorString);
                    }else if(colorString.includes("rgb")){
                        return rgb2obj(colorString)
                    }
                }catch(e){
                    console.error(`Invalid color string: "${colorString}"`);
                }
            }
            function rgb2obj(rgb){
                var arr = rgb.substr(rgb.indexOf("(") + 1).split(",");
                var color = {
                    r: parseFloat(arr[0]),
                    g: parseFloat(arr[1]),
                    b: parseFloat(arr[2]),
                    a: parseFloat(arr[3]) || 1,
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
            
            //given a percentage, returns the rgba color at that point on linear gradient between the 3 supplied colors. 
            function getColorForShade(alpha) {
                var endIndex = shades.length - 1,
                    where = alpha * endIndex,
                    i = Math.ceil(where) || 1;
                    //the 2 colors on the gradient that we fall between are [i] and [i - 1].
                    //once we have determined i, we now need to find how much of each color we need to mix.
                var lower = shades[i - 1], 
                    upper = shades[i], 
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
                return this.base;
            }
            this.toString = toString.bind(this);

            //This function returns an object with a toString() method,
            // so that zDog stores the object instead of a string value,
            // so that its value can change each time zDog goes to render the object.
            // ie. `shape.color = red.shadeByDepth(this)` will return the correct shade
            // based on the depth at each frame without needing to manually be called in animate().
            //This does not work on shapes with colors defined manually with .highlight or .shadow.
            function shadeByDepth(zdogObj, reverse){
                return {
                    min: 100,
                    max: 100,
                    toString: function(){
                        if (zdogObj && zdogObj.sortValue){       
                            return this.adjustColor(zdogObj.sortValue, reverse);
                        }else{
                            console.log("shadeByDepth(): no sortValue found: ", zdogObj);
                            return "red";
                        }
                    },
                    adjustColor: function(sortValue, reverse){
                        if (sortValue > this.max) this.max = sortValue;
                        if (sortValue < this.min) this.min = sortValue;
                        var upper = 0.7, //how bright the lighting goes (closer to 1)
                            lower = 0.3; //how dark the lighting goes (closer to 0)
                        var percent = mapScale(sortValue, this.min, this.max, (reverse? upper : lower), (reverse? lower : upper));
                        var adjustedColor = getColorForShade(percent);
                        return adjustedColor;
                    },
                    highlight: highlightColor,
                    base: baseColor,
                    shadow: shadowColor,
                }
            }
            this.shadeByDepth = shadeByDepth.bind(this);
        } 
        var yellow = new Color('#e8b94f', '#f9d76c', '#d68846'),
            brown_light = new Color('#c4a27c', '#d5b693', '#a46d4e'),
            brown_mid = new Color('#926c47', '#ac8967', '#79482f'),
            brown_dark =  new Color('#805132', '#8b664c', '#5b361e'),
            grey = new Color('#d7d1d7', '#eef0ef', '#7e6459'),
            pink = new Color('#e6b2a7', '#f2ccc3', '#c47a6b'),
            orange = new Color('#eeae75', '#ffc87e', '#d87c4e');

            
        this.anchor = new Zdog.Anchor(options);
        this.head = new Head({
            addTo: this.anchor,
            // translate: { y: -70},
        });
        this.head.hat = new Hat({
            addTo: this.head.anchor,
            translate: { y: -70 },
        });
        this.body = new Body({
            addTo: this.anchor,
            translate: { y: 65 },
        });

        shadeAllByDepth(this);
    
        function Head(options){
            this.anchor = new Zdog.Anchor(options);

            this.head = new Zdog.Shape({
                addTo: this.anchor,
                stroke: 120,
                path: [
                    { x: 0, y: 20, z: -1 },
                    { x: 0, y: 10, z: 0 },
                    { x: 0, y: 0, z: 0 },
                ],
                color: yellow,
            });
            this.faceAnchor = new Zdog.Anchor({
                addTo: this.anchor,
                translate: { x: 0, y: -10, z: 0 },
            });
            this.beak = new Zdog.Cone({
                addTo: this.faceAnchor,
                length: 130,
                diameter: 10,
                color: orange,
                stroke: 5,
                translate: { x: 0, y: 0, z: 55 },
                rotate: { x: TAU / 60 },
            });
            this.eyeL = new Zdog.Shape({
                addTo: this.faceAnchor,
                stroke: 10,
                color: 'black',
                translate: { x: 20, y: -15, z: 50 },
            });
            this.eyeR = flipShape(this.eyeL.copy(), 'x');

            this.eyelinesL = new Zdog.Shape({
                addTo: this.eyeL,
                stroke: 2,
                path: [
                    { x: 15, y: -1, z: 0 },
                    { x: 0, y: 0, z: 0 },
                    { x: 15, y: 7, z: 0 },
                ],
                closed: false,
                color: grey,
                translate: { x: -5, y: 10, z: 5 },
                rotate: { y: -TAU / 12 },
            });
            this.eyelinesR = flipShape(this.eyelinesL.copy({
                addTo: this.eyeR,
            }), 'x');

        };//end head

        function Hat(options){
            this.anchor = new Zdog.Anchor(options);

            this.halfL = new HatHalf({
                addTo: this.anchor,
            }, 'L');

            this.halfR = new HatHalf({
                addTo: this.anchor,
            }, 'R');

            function HatHalf(options, side){
                this.anchor = new Zdog.Anchor(options);
                
                this.leaf = new Zdog.Shape({
                    addTo: this.anchor,
                    stroke: 5,
                    path: [
                        { x: 0, y: 0, z: 0 },
                        { arc: [
                            { x: 0, y: 0, z: 40 },
                            { x: 0, y: 15, z: 70 },
                        ]},
                        //outer edge
                        { arc: [
                            { x: 30, y: 10, z: 70 },
                            { x: 50, y: 25, z: 30 },
                        ]},
                        { arc: [
                            { x: 60, y: 30, z: 10 },
                            { x: 60, y: 30, z: 0 },
                        ]},
                        { x: 60, y: 30, z: -20 },
                        { arc: [
                            { x: 60, y: 30, z: -40 },
                            { x: 40, y: 15, z: -70 },
                        ]},
                        { arc: [
                            { x: 30, y: 5, z: -90 },
                            { x: 0, y: 5, z: -120 },
                        ]},
                        { arc: [
                            { x: 0, y: 0, z: -50 },
                            { x: 0, y: 0, z: 0 },
                        ]},
                        
                    ],
                    closed: false,
                    fill: true,
                    color: brown_light,
                    translate: { z: 10 },
                    rotate: { x: TAU / 32 },
                });

                this.bandAnchor = new Zdog.Anchor({
                    addTo: this.anchor,
                    translate: { x: 60, y: 30, z: -7 },
                    rotate: { x: TAU / 64 },
                });

                this.clasp = new Zdog.Shape({
                    addTo: this.bandAnchor,
                    stroke: 5,
                    path: [
                        { x: 0, y: 0, z: 12 },       
                        { x: 0, y: 0, z: -12 },       
                        { x: 1, y: 12, z: -8 },     
                        { x: 1, y: 12, z: 8 },     
                    ],
                    closed: true,
                    fill: true,
                    color: grey,
                });

                this.band = new Zdog.Shape({
                    addTo: this.bandAnchor,
                    stroke: 5,
                    path: [
                        { x: 1, y: 15, z: -7 },     
                        { x: 1, y: 15, z: 7 }, 
                        { arc: [
                            { x: 10, y: 120, z: 7 }, 
                            { x: (-this.bandAnchor.translate.x), y: 120, z: 4 }, 
                        ]},
                        { x: (-this.bandAnchor.translate.x), y: 120, z: -4 },
                        { arc: [
                            { x: 10, y: 120, z: -7 }, 
                            { x: 1, y: 15, z: -7 }, 
                        ]},
                    ],
                    closed: true,
                    fill: true,
                    color: brown_dark,
                });
                
                flipIfRight(this, side);
            }
        };//end hat
        
        function Body(options){
            this.anchor = new Zdog.Anchor(options);

            this.shirt = new Shirt({
                addTo: this.anchor,
                rotate: { x: -TAU / 80 },
            })

            function Shirt(options){
                this.anchor = new Zdog.Anchor(options);

                this.shirtFL = new ShirtHalf({
                    addTo: this.anchor,
                }, 'L');
    
                this.shirtFR = new ShirtHalf({
                    addTo: this.anchor,
                }, 'R');
    
                this.shirtBL = new ShirtHalf({
                    addTo: this.anchor,
                    rotate: { y: TAU / 2 },
                }, 'L');
    
                this.shirtBR = new ShirtHalf({
                    addTo: this.anchor,
                    rotate: { y: TAU / 2 },
                }, 'R');
    
                function ShirtHalf(options, side){
                    this.anchor = new Zdog.Group(options);
    
                    this.massOffset = new Zdog.Shape({
                        addTo: this.anchor,
                        visible: false,
                        translate: { x: 100, y: 0, z: 100 },
                    });
    
                    this.shirtPiece = new Zdog.Shape({
                        addTo: this.anchor,
                        stroke: 7,
                        path: [
                            //top edge
                            { x: 0, y: 0, z: 60 },
                            { x: 7, y: -25, z: 55 },
                            { arc: [
                                { x: 65, y: -35, z: 55 },
                                { x: 65, y: -35, z: 0 },
                            ]},
                            //back edge
                            { x: 75, y: 0, z: 0 },
                            { x: 90, y: 30, z: 0 },
                            //bottom edge
                            { x: 80, y: 40, z: 0 },
                            //bottom edge
                            { arc: [
                                { x: 80, y: 50, z: 70 },
                                { x: 0, y: 50, z: 65 },
                            ]},
                            //center edge
                            { x: 0, y: 35, z: 70 },
                            { x: 0, y: 0, z: 60 },
                            
                        ],
                        closed: false,
                        fill: true,
                        color: brown_light,
                    });
    
                    flipIfRight(this, side);
                }
            }



        }

        function flipShape(zdogShape, axis){
            //still kinda wonky, its doesnt like flipping the same shape (or a copy of that shape) twice, and I dont know why
            if (!axis) axis = flipAxis;
            axis = axis.toLowerCase();
            if (!zdogShape.addTo){ //if it doesn't have an addTo, we are assuming it's not a Zdog shape,
                zdogShape = zdogShape.anchor; //allows custom contructed objects to be flippable
            }
            if (!zdogShape) return undefined;
            if (zdogShape.path){
                for (var i = 0; i < zdogShape.path.length; i++){
                    if(zdogShape.path[i][axis]){
                        zdogShape.path[i][axis] = -zdogShape.path[i][axis];
                    }else
                    if (zdogShape.path[i].arc){
                        for (var j = 0; j < zdogShape.path[i].arc.length; j++){
                            zdogShape.path[i].arc[j][axis] = -zdogShape.path[i].arc[j][axis];
                        }
                    }else
                    if (zdogShape.path[i].bezier){
                        for (var j = 0; j < zdogShape.path[i].bezier.length; j++){
                            zdogShape.path[i].bezier[j][axis] = -zdogShape.path[i].bezier[j][axis];
                        }
                    }
                }

                zdogShape.updatePath();
            }
            if (zdogShape.translate && zdogShape.translate[axis]){
                zdogShape.translate[axis] = -zdogShape.translate[axis];
            }
            if (zdogShape.rotate){
                if (zdogShape.rotate.x && axis != 'x') zdogShape.rotate.x =  -zdogShape.rotate.x;
                if (zdogShape.rotate.y && axis != 'y') zdogShape.rotate.y =  -zdogShape.rotate.y;
                if (zdogShape.rotate.z && axis != 'z') zdogShape.rotate.z =  -zdogShape.rotate.z;
            }
            return zdogShape;
        }

        function flipAll(partObject){
            for (var key in partObject) {
                if (partObject.hasOwnProperty(key) && key != 'anchor') { //last bit prevents flipping of main anchor options
                    flipShape(partObject[key]);
                }
            }
        }

        function flipIfRight(partObject, side){
            if (side && side.toUpperCase() == 'R'){
                flipAll(partObject);
            }
        }

        function shadeAllByDepth(partObject, reverse){
            for (var key in partObject) {
                if (partObject.hasOwnProperty(key)) {
                    var thisPart = partObject[key];
                    if (thisPart.color && thisPart.color.shadeByDepth){
                        thisPart.color = thisPart.color.shadeByDepth(thisPart, reverse);
                    }else if(thisPart.anchor){
                        shadeAllByDepth(thisPart, reverse);
                    }
                }
            }
        }

        function toggleWireframeAll(partObject){
            partObject.wireframeEnabled = !partObject.wireframeEnabled;
            for (var key in partObject) {
                if (partObject.hasOwnProperty(key)) {
                    var thisPart = partObject[key];
                    if (typeof thisPart == 'object'){
                        if ('fill' in thisPart){ //`in` is used to check if a property is defined at all (regardless of truthiness in value).
                            //Parts are marked as ignored if they are already not filled, 
                            // and thus are skipped even in future toggles.
                            // This is to prevent accidentally filling parts on toggle back.
                            if(!('wireframeIgnore' in thisPart) && !thisPart.fill){
                                thisPart.wireframeIgnore = true;
                            }else if(thisPart.fill){
                                thisPart.wireframeIgnore = false;
                            }
                            if(!thisPart.wireframeIgnore){
                                thisPart.fill = !partObject.wireframeEnabled;
                            }
                        }else if(thisPart.anchor){
                            toggleWireframeAll(thisPart);
                        }
                    }
                }
            }
        }

        this.toggleWireframe = function(){
            toggleWireframeAll(this);
        }.bind(this);
    };

    function animate() {

        if(spinning) illo.rotate.y += TAU / 720;

        illo.updateRenderGraph();
        requestAnimationFrame(animate);
    }
    animate();

});