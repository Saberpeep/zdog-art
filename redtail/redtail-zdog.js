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
    var redtail = new Redtail({
        addTo: illo,
        translate: { y: -100 },
    });

    window.redtail = redtail;
    console.log("redtail:", redtail);

    canvas.addEventListener('wheel', function(e){
        e.preventDefault();
        var zoom = illo.zoom
        zoom -= e.deltaY / 1000;
        if (zoom < 0.1){
            zoom = 0.1;
        }
        illo.zoom = zoom;
    }, false);

    function Redtail(options){

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
                if (colorString.includes("#")){
                    return hex2rgb(colorString);
                }else if(colorString.includes("rgb")){
                    return rgb2obj(colorString)
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
        var white = new Color('#aebad2', '#dfe5f2', '#959dad'),
            red = new Color('#eb435f','#fcc7d0','#730013'),
            brown = new Color('rgba(67, 43, 19, 0.9)', 'rgba(161, 124, 43, 0.9)', 'rgba(28, 16, 4, 0.9)'),
            grey = new Color('#92929a','#e1e1e6','#292a2d',);
            yellow = new Color('#87987c','#dedd6f','#25321b');
        this.colors = {white:white, red:red, brown:brown, grey:grey};

            
        this.anchor = new Zdog.Anchor(options);
        this.cockpit = new Cockpit({
            addTo: this.anchor,
            translate: { x: -90, y: 70},
        });
        this.mainhull = new MainHull({
            addTo: this.anchor,
        });
        this.engine = new Engine({
            addTo: this.anchor,
            translate: { x: 30, y: 40 },
        });
        this.wingL = new Wing({
            addTo: this.anchor,
        }, 'L');
        this.wingR = new Wing({
            addTo: this.anchor,
        }, 'R');
        this.fuselageL = new Fuselage({
            addTo: this.wingL.anchor,
            translate: { z: 140 },
        }, 'L');
        this.fuselageR = new Fuselage({
            addTo: this.wingR.anchor,
            translate: { z: -140 },
        }, 'R');
        this.weaponL = new Weapon({
            addTo: this.fuselageL.anchor,
        }, 'L');
        this.weaponR = new Weapon({
            addTo: this.fuselageR.anchor,
        }, 'R');

        shadeAllByDepth(this);
    
        function Cockpit(options){
            this.anchor = new Zdog.Anchor(options);

            this.glass = new Zdog.Shape({
                addTo: this.anchor,
                stroke: 120,
                color: brown,
            });

            this.capGroup = new Zdog.Group({
                addTo: this.anchor,
            })
            this.cylinder = new Zdog.Cylinder({
                addTo: this.capGroup,
                color: grey,
                backface: grey.shadow,
                diameter: 100,
                length: 30,
                translate: { y: -55 },
                rotate: { x: TAU / 4 }
            });
            this.sideboxL = new Zdog.Box({
                addTo: this.capGroup,
                width: 45,
                height: 30,
                depth: 15,
                stroke: 1,
                translate: { z: this.cylinder.diameter / 2, y: this.cylinder.translate.y },
                rotate: { x: TAU / 80 },
                color: grey,
            });
            this.sideboxR = flipShape(this.sideboxL.copy({}));

            this.doorSealL = new Zdog.Ellipse({
                addTo: this.anchor,
                width: 100,
                height: 100,
                stroke: 7,
                translate: { z: 35 },
                color: grey,
            });
            this.doorSealR = flipShape(this.doorSealL.copy({}));

            this.doorBumpL = new Zdog.Ellipse({
                addTo: this.doorSealL,
                width: 45,
                height: 45,
                stroke: 7,
                fill: true,
                translate: { z: 20, x: 5, y: 17 },
                rotate: { y: -TAU / 30, x: -TAU / 30},
                color: grey,
            });
            this.doorBumpR = flipShape(this.doorBumpL.copy({
                addTo: this.doorSealR,
            }));

            this.topBumpL = new Zdog.Shape({
                addTo: this.doorSealL,
                stroke: 15,
                path: [
                    { x: -2, y: 0 },
                    { x: 0, y: -7 },
                ],
                translate: { x: -40, y: -40 },
                color: grey,
            });
            this.topBumpR = flipShape(this.topBumpL.copy({
                addTo: this.doorSealR,
            }));

            this.backBumpL = new Zdog.Shape({
                addTo: this.doorSealL,
                stroke: 15,
                path: [
                    { y: -10 },
                    { y: 10 },
                    { x: 10, y: 14 },
                    { x: 10, y: -14 },
                ],
                closed: true,
                translate: { x: 50 },
                rotate: { y: -TAU / 8 },
                color: grey,
            });
            this.backBumpR = flipShape(this.backBumpL.copy({
                addTo: this.doorSealR,
            }));

            this.backSeal = new Zdog.Ellipse({
                addTo: this.anchor,
                width: 70,
                height: 70,
                stroke: 7,
                fill: true,
                translate: { x: 50 },
                rotate: { y: TAU / 4 },
                color: grey,
            });
            this.backCone = new Zdog.Cone({
                addTo: this.anchor,
                diameter: 60,
                length: 40,
                stroke: 7,
                translate: { x: 50 },
                rotate: { y: -TAU / 4 },
                color: grey,
                backface: grey.shadow,
            });

            this.interior = new Zdog.Shape({
                addTo: this.anchor,
                stroke: 10,
                path: [
                    { x: 40, y: 30, z: 0 },
                    {
                        arc: [
                            { x: 0, y: 40 }, // corner
                            { x: -30, y: 30 }, // end point
                        ]
                    },
                    { x: -35, y: 20, z: 0 },
                    
                    { x: -20, y: 20, z: 30 },
                    { x: -25, y: 10, z: 30 },
                    { x: -37, y: 10, z: 10 },
                    { x: -37, y: 15, z: 10 },

                    { x: -35, y: 20, z: 0 },

                    { x: -20, y: 20, z: -30 },
                    { x: -25, y: 10, z: -30 },
                    { x: -37, y: 10, z: -10 },
                    { x: -37, y: 15, z: -10 },

                    { x: -35, y: 20, z: 0 },
                    { x: -30, y: 30 },
                    {
                        arc: [
                            { x: 0, y: 40 }, // corner
                            { x: 40, y: 30, z: 0 }, // end point
                        ]
                    },
                ],
                fill: true,
                color: brown,
            });
        };//end cockpit
        
        function MainHull(options){
            this.anchor = new Zdog.Anchor(options);

            this.centerOfMass = new Zdog.Shape({
                addTo: this.anchor,
                stroke: 10,
                path: [
                    { x: 0, y: 0, z: 0 },  
                ],
                color: red.shadow,
                visible: false,
            });

            this.antenna = new Zdog.Shape({
                //helps alliviate z-fighting
                addTo: this.anchor,
                stroke: 7,
                path: [
                    { x: -100, y: 5, z: -75 },
                    { x: -80, y: -30, z: -76 },
                    { x: -70, y: -32, z: -76 },
                    { x: -60, y: -30, z: -76 },
                    { x: -74, y: -5, z: -76 },
                    { x: -80, y: -5, z: -75 },
                ],
                color: white,
                closed: true,
                fill: true,
            }) 

            this.hullR = new HullHalf({
                addTo: this.anchor,
            }, 'R');
            this.hullL = new HullHalf({
                addTo: this.anchor,
            }, 'L');

            function HullHalf(options, side){
                this.anchor = new Zdog.Anchor(options);

                this.panelGroup = new Zdog.Group({
                    addTo: this.anchor
                });
    
                this.panelMassOffset = new Zdog.Shape({
                    //helps alliviate z-fighting
                    addTo: this.panelGroup,
                    stroke: 7,
                    path: [{ x: -200, y: -200, z: -100 }],
                    color: red,
                    visible: false,
                })      
    
                this.mainPanel = new Zdog.Shape({
                    addTo: this.panelGroup,
                    stroke: 7,
                    path: [
                        { x: -150, y: 0, z: 0 },
                        { x: -140, y: 1, z: 30 },
                        { x: -110, y: -5, z: 30 },
                        { x: -100, y: -7, z: 50 },
                        { x: -90, y: -8, z: 50 },
                        //in and around bump
                        { x: -95, y: -10, z: 20 },
                        { x: -76, y: -10, z: 15 },
                        //curve to back
                        { x: -65, y: -10, z: 40 },
                        {
                            arc: [
                                { x: 0, y: -15, z: 30 }, // corner
                                { x: 40, y: -10, z: 35 }, // end point
                            ]
                        },
                        //small cutout
                        { x: 50, y: -11, z: 15 },
                        { x: 60, y: -9, z: 15 },
                        { x: 50, y: -8, z: 36 },
                        //tail area
                        { x: 70, y: -4, z: 37 },
                        { x: 85, y: -6, z: 20 },
                        { x: 90, y: 0, z: 20 },
                        { x: 100, y: -4, z: 0 },
                        //inner return
                        {
                            arc: [
                                { x: 0, y: -40, z: 0 }, // corner
                                { x: -150, y: 0, z: 0 }, // end point
                            ]
                        },
                    ],
                    fill: true,
                    closed: true,
                    color: white,
                    backface: white.shadow,
                    front: { y: -1 },
                });
    
                this.trimPanel = new Zdog.Shape({
                    addTo: this.panelGroup,
                    stroke: 7,
                    path: [
                        { x: -140, y: 1, z: 35 },
                        { x: -110, y: -5, z: 35 },
                        { x: -100, y: -7, z: 55 },
                        { x: -90, y: -8, z: 55 },
                        //out and around bump
                        { x: -85, y: -7, z: 60 },
                        { x: -65, y: -8, z: 55 },
                        //curve to back
                        { x: -65, y: -10, z: 45 },
                        {
                            arc: [
                                { x: 0, y: -15, z: 35 }, // corner
                                { x: 70, y: -4, z: 43 }, // end point
                            ]
                        },
                        { x: 71, y: 0, z: 55 },
                        //curve to front
                        {
                            arc: [
                                { x: 0, y: -15, z: 50 }, // corner
                                { x: -100, y: 5, z: 75 }, // end point
                            ]
                        },
                        {
                            arc: [
                                { x: -120, y: 5, z: 80 }, // corner
                                { x: -140, y: 1, z: 35 }, // end point
                            ]
                        },
    
                    ],
                    fill: true,
                    closed: true,
                    color: white,
                    backface: white.shadow,
                    front: { y: -1 },
                });
    
                this.trimLine = new Zdog.Shape({
                    addTo: this.panelGroup,
                    stroke: 1,
                    path: [
                        { x: -140, y: 1, z: 30 },
                        { x: -110, y: -5, z: 30 },
                        { x: -100, y: -7, z: 50 },
                        { x: -90, y: -8, z: 50 },
                        //large cutout
                        { x: -95, y: -10, z: 20 },
                        { x: -76, y: -10, z: 15 },
                        //curve to back
                        { x: -65, y: -10, z: 40 },
                        {
                            arc: [
                                { x: 0, y: -15, z: 30 }, // corner
                                { x: 40, y: -10, z: 35 }, // end point
                            ]
                        },
                        //small cutout
                        { x: 50, y: -11, z: 15 },
                        { x: 60, y: -9, z: 15 },
                        { x: 50, y: -8, z: 36 },
                        { x: 70, y: -4, z: 37 },
                        //return
                        {
                            arc: [
                                { x: 0, y: -15, z: 30 }, // corner
                                { x: -65, y: -10, z: 40 }, // end point
                            ]
                        },
                        { x: -65, y: -8, z: 50 },
                        { x: -85, y: -7, z: 55 },
                        { x: -90, y: -8, z: 50 },
                        { x: -100, y: -7, z: 50 },
                        { x: -110, y: -5, z: 30 },
                        { x: -140, y: 1, z: 30 },
                    ],
                    fill: true,
                    closed: true,
                    color: grey,
                    backface: grey.shadow,
                    front: { y: -1 },
                });
    
                this.trimLineDetail = new Zdog.Ellipse({
                    addTo: this.panelGroup,
                    width: 8,
                    height: 8,
                    stroke: 3,
                    fill: false,
                    translate: { x: -82, y: -7, z: 30 },
                    rotate: { x: TAU / 4 },
                    color: grey.shadow,
                });
    
                this.headlightGroup = new Zdog.Group({
                    addTo: this.anchor,
                });
                this.headlightMassOffset = new Zdog.Shape({
                    addTo: this.headlightGroup,
                    stroke: 7,
                    path: [
                        { x: -200, y: 200, z: 100 },
                    ],
                    translate: { y: 7 },
                    color: yellow,
                    visible: false,
                });
                this.headlight = new Zdog.Shape({
                    addTo: this.headlightGroup,
                    stroke: 7,
                    path: [
                        { x: -120, y: 0, z: 65 },
                        //curve to front
                        {
                            arc: [
                                { x: -140, y: 0, z: 50 }, // corner
                                { x: -140, y: 0, z: 35 }, // end point
                            ]
                        },
                        //curve to bottom
                        {
                            arc: [
                                { x: -120, y: 10, z: 35 }, // corner
                                { x: -120, y: 10, z: 35 }, // end point
                            ]
                        },
                        //curve to back
                        {
                            arc: [
                                { x: -120, y: 10, z: 65 }, // corner
                                { x: -120, y: 0, z: 65 }, // end point
                            ]
                        },
                    ],
                    fill: true,
                    translate: { y: 7 },
                    color: yellow.highlight,
                    backface: yellow,
                    front: { y: 1 },
                });
    
                this.tailFinA = new Zdog.Shape({
                    addTo: this.anchor,
                    stroke: 7,
                    path: [
                        //top connecting edge
                        { x: 76, y: 0, z: 55 },
                        { x: 75, y: -4, z: 43 },
                        //inner towards back
                        { x: 80, y: -6, z: 30 },
                        { x: 100, y: -10, z: 29 },
                        //top middle
                        { x: 110, y: -15, z: 0 },
                        { x: 130, y: -20, z: 0 },
                        //return to top connecting edge
                        { x: 110, y: -4, z: 60 },
                        { x: 76, y: 0, z: 55 },
                    ],
                    fill: true,
                    closed: true,
                    color: red,
                    front: { y: -1 },
                });
    
                this.tailFinB = new Zdog.Shape({
                    addTo: this.anchor,
                    stroke: 7,
                    path: [
                        { x: 110, y: -4, z: 60 },
                        { x: 130, y: -20, z: 0 },
                        { x: 130, y: -4, z: 0 },
                    ],
                    fill: true,
                    closed: true,
                    color: red,
                    front: { y: -1 },
                });

                flipIfRight(this, side);
        

            }//end hull half

        }//end main hull

        function Engine(options){
            this.anchor = new Zdog.Anchor(options);
            
            this.engineA = new Zdog.Hemisphere({
                addTo: this.anchor,
                diameter: 63,
                stroke: 7,
                backface: false,
                rotate: { y: TAU / 4 },
                color: white,
            });
            this.engineB = new Zdog.Cone({
                addTo: this.anchor,
                diameter: 30,
                length: 60,
                stroke: 40,
                backface: false,
                translate: { x: 5 },
                rotate: { y: -TAU / 4 },
                color: white,
            });

            
            this.jet = new Zdog.Cone({
                addTo: this.anchor,
                diameter: 60,
                length: 60,
                stroke: 7,
                backface: grey.shadow,
                translate: { x: 120 },
                rotate: { y: TAU / 4 },
                color: grey,
            });
            this.jetEdgeA = new Zdog.Ellipse({
                addTo: this.jet,
                diameter: 60,
                stroke: 7,
                color: grey,
            });
            this.jetRimPieces = [];
            for (var i = 0; i < 4; i++){
                this.jetRimPieces.push(
                    new Zdog.Ellipse({
                        addTo: this.jet,
                        quarters: 1,
                        diameter: 60,
                        stroke: 2,
                        translate: { z: 1 },
                        rotate: { z: (TAU / 4) * i },
                        color: grey.shadow,
                    })
                );
            }
            this.backBumpL = new Zdog.Shape({
                addTo: this.anchor,
                stroke: 15,
                path: [
                    { y: -5 },
                    { y: 5 },
                    { x: 20, y: 10 },
                    { x: 20, y: -10 },
                ],
                closed: true,
                translate: { x: 60, z: 5 },
                rotate: { y: TAU / 8 },
                color: grey,
            });
            this.backBumpR = flipShape(this.backBumpL.copy());

        }//end engine

        function Wing(options, side){

            this.anchor = new Zdog.Anchor(options);

            this.wing = new Zdog.Shape({
                addTo: this.anchor,
                stroke: 14,
                path: [
                    { x: 50, y: 0, z: 0 },
                    { x: -50, y: 0, z: 0 },
                    {
                        arc: [
                            { x: -30, y: 0, z: 0 }, //corner
                            { x: -20, y: 0, z: 30 }, //endpoint
                        ]
                    },
                    {
                        arc: [
                            { x: -10, y: 0, z: 50 }, //corner
                            { x: -20, y: 0, z: 80 }, //endpoint
                        ]
                    },
                    { x: 50, y: 0, z: 80 },
                    {
                        arc: [
                            { x: 40, y: 0, z: 25 }, //corner
                            { x: 50, y: 0, z: 0 }, //endpoint
                        ]
                    },
                ],
                closed: true,
                fill: true,
                translate: { y: 20, z: 50 },
                color: white,
                backface: white.shadow,
                front: { y: -1 },
            });

            this.ammoBay = new Zdog.Box({
                addTo: this.wing,
                width: 30,
                height: 10,
                depth: 60,
                stroke: 20,
                color: grey,
                translate: { x: 20, y: 20, z: 50 },
                topFace: white,
            });

            this.ammoBelt = new Zdog.Shape({
                addTo: this.anchor,
                stroke: 7,
                path: [
                    { x: -5, y: 40, z: 100 },
                    {
                        arc: [
                            { x: -30, y: 200, z: 100 }, //corner
                            { x: -70, y: 200, z: 140 }, //endpoint
                        ]
                    },
                    { x: -40, y: 200, z: 140 },
                    {
                        arc: [
                            { x: -10, y: 200, z: 100 }, //corner
                            { x: 15, y: 40, z: 100 }, //endpoint
                        ]
                    },
                    
                ],
                closed: true,
                fill: true,
                translate: { y: 0, z: 0 },
                color: grey.shadow,
            });

            flipIfRight(this, side);
    
            
        }//end wing

        function Fuselage(options, side){
            this.anchor = new Zdog.Anchor(options);

            this.fuselageTop = new Zdog.Shape({
                addTo: this.anchor,
                stroke: 14,
                path: [
                    //inner edge
                    { x: -70, y: 0, z: 0 },
                    {
                        arc: [
                            { x: 0, y: 0, z: -10 }, //corner
                            { x: 180, y: 0, z: 0 }, //endpoint
                        ]
                    },
                    { x: 200, y: 15, z: 0 },
                    //outer edge
                    { x: 200, y: 25, z: 15 },    
                    { x: 180, y: 10, z: 20 },
                    { x: 180, y: 0, z: 0 },//fill cut in
                    { x: 180, y: 10, z: 20 },//fill cut in
                    {
                        arc: [
                            { x: 100, y: 10, z: 30 }, //corner
                            { x: 70, y: 10, z: 50 }, //endpoint
                        ]
                    },
                    { x: 50, y: 10, z: 70 },
                    { x: -30, y: 10, z: 80 },
                    //return
                    { x: -70, y: 0, z: 0 },
                    
                ],
                closed: false,
                fill: true,
                color: white,
            });

            this.fuselageTopHandleAnchor = new Zdog.Anchor({
                addTo: this.anchor,
                translate: { x: 30, y: 0, z: 45 },
                scale: 0.8,
            });

            this.fuselageTopHandleA = new Zdog.Shape({
                addTo: this.fuselageTopHandleAnchor,
                stroke: 14,
                path: [
                    { x: -14, y: -7, z: 0 },
                    { x: 14, y: -7, z: 0 },
                ],
                color: grey,
            });
            this.fuselageTopHandleB = new Zdog.Shape({
                addTo: this.fuselageTopHandleAnchor,
                stroke: 14,
                path: [
                    { x: -25, y: -7, z: 0 },
                    { x: -35, y: -7, z: 0 },
                    { x: -35, y: 0, z: -20 },
                    { x: -35, y: 0, z: 0 },
                ],
                closed: true,
                fill: true,
                color: white,
            });
            this.fuselageTopHandleC = new Zdog.Shape({
                addTo: this.fuselageTopHandleAnchor,
                stroke: 14,
                path: [
                    { x: 25, y: -7, z: 0 },
                    { x: 35, y: -7, z: 0 },
                    { x: 35, y: 0, z: -20 },
                    { x: 35, y: 0, z: 0 },
                ],
                closed: true,
                fill: true,
                color: white,
            });

            this.fuselageFrontInner = new Zdog.Shape({
                addTo: this.anchor,
                stroke: 14,
                path: [
                    //top inner edge
                    { x: -75, y: 30, z: -5 },
                    { x: -70, y: 0, z: 0 },
                    //outer edge
                    { x: -50, y: 5, z: 45 },
                    //top of front jet hole
                    { x: -60, y: 20, z: 50 },
                    {
                        arc: [
                            { x: -65, y: 10, z: 50 }, //corner
                            { x: -75, y: 35, z: 10 }, //endpoint
                        ]
                    },
                    //bottom of front jet hole
                    { x: -75, y: 35, z: 10 },
                    { x: -60, y: 80, z: 10 },
                    { x: -40, y: 105, z: 45 },
                    //bottom edge
                    { x: -40, y: 100, z: 30 },
                    { x: -50, y: 100, z: 0 },
                    { x: -30, y: 160, z: 0 },
                    { x: -30, y: 160, z: 1 },
                    //return
                    
                ],
                closed: true,
                fill: true,
                color: white,
            });

            this.fuselageFrontOuter = new Zdog.Shape({
                addTo: this.anchor,
                stroke: 14,
                path: [
                    //top inner edge
                    { x: -50, y: 5, z: 45 },
                    //outer edge
                    { x: -30, y: 10, z: 80 },
                    { x: -20, y: 70, z: 85 },
                    { x: -30, y: 110, z: 50 },
                    { x: -20, y: 160, z: 50 },
                    //bottom edge
                    { x: -20, y: 160, z: 35 },
                    { x: -40, y: 100, z: 30 },
                    //return
                    //bottom of front jet hole
                    { x: -40, y: 105, z: 45 },
                    { x: -30, y: 80, z: 77 },
                    //top of front jet hole
                    { x: -50, y: 35, z: 80 },
                    {
                        arc: [
                            { x: -50, y: 20, z: 80 }, //corner
                            { x: -60, y: 20, z: 50 }, //endpoint
                        ]
                    },
                    //return
                    
                ],
                closed: true,
                fill: true,
                color: white,
            });

            this.fuselageOuterSide = new Zdog.Shape({
                addTo: this.anchor,
                stroke: 14,
                path: [
                    //top edge
                    { x: 200, y: 25, z: 15 },    
                    { x: 180, y: 10, z: 20 },
                    {
                        arc: [
                            { x: 100, y: 10, z: 30 }, //corner
                            { x: 70, y: 10, z: 50 }, //endpoint
                        ]
                    },
                    { x: 50, y: 10, z: 70 },
                    { x: -30, y: 10, z: 80 },
                    //front edge
                    { x: -20, y: 70, z: 85 },
                    { x: -30, y: 110, z: 50 },
                    { x: -20, y: 160, z: 50 },
                    //bottom edge
                    { x: 100, y: 60, z: 50 },
                    { x: -20, y: 70, z: 85 },//fill cut in 1
                    { x: 100, y: 60, z: 50 },//fill cut in 1
                    { x: 50, y: 10, z: 70 },//fill cut in 2
                    { x: 100, y: 60, z: 50 },//fill cut in 2
                    { x: 70, y: 10, z: 50 },//fill cut in 3
                    { x: 100, y: 60, z: 50 },//fill cut in 3
                    { x: 200, y: 25, z: 15 },
                    
                ],
                closed: true,
                fill: true,
                color: white,
            });

            this.fuselageOuterBump = new Zdog.Shape({
                addTo: this.anchor,
                stroke: 20,
                path: [
                    { x: 15, y: 60, z: 82 },
                    { x: 20, y: 60, z: 80 },
                ],
                color: grey,
            });

            this.fuselageBottomSide = new Zdog.Shape({
                addTo: this.anchor,
                stroke: 14,
                path: [
                    //back edge
                    { x: 200, y: 15, z: 0 },
                    //outer edge
                    { x: 200, y: 25, z: 15 },
                    { x: 100, y: 60, z: 50 },
                    //front edge outer
                    { x: -20, y: 160, z: 50 },
                    { x: -20, y: 160, z: 35 },
                    //arm cutout
                    { x: 50, y: 110, z: 27 },
                    { x: 50, y: 110, z: 7 },
                    //front edge inner
                    { x: -30, y: 160, z: 1 },
                    { x: -30, y: 160, z: 0 },
                    //inner edge
                    { x: 100, y: 60, z: 0 },
                    { x: 200, y: 25, z: 0 },
                    
                ],
                closed: true,
                fill: true,
                color: white,
            });

            this.fuselageInnerSide = new Zdog.Shape({
                addTo: this.anchor,
                stroke: 14,
                path: [
                    //top edge
                    { x: -70, y: 0, z: 0 },
                    {
                        arc: [
                            { x: 0, y: 0, z: -10 }, //corner
                            { x: 180, y: 0, z: 0 }, //endpoint
                        ]
                    },
                    { x: 200, y: 15, z: 0 },
                    //bottom edge
                    { x: 200, y: 25, z: 0 },
                    { x: 100, y: 60, z: 0 },
                    { x: -30, y: 160, z: 0 },
                    //front edge
                    { x: -75, y: 30, z: -5 },
                    { x: -70, y: 0, z: 0 },
                    
                ],
                closed: true,
                fill: true,
                color: white,
            });

            this.frontJetFlap = new Zdog.Shape({
                addTo: this.anchor,
                stroke: 14,
                path: [
                    //top edge
                    { x: -55, y: 50, z: 80 },
                    { x: -63, y: 30, z: 75 },
                    { x: -70, y: 20, z: 25 },
                    { x: -75, y: 40, z: 20 },
                    //front edge
                    { x: -85, y: 30, z: 30 },
                    { x: -70, y: 20, z: 25 },//fill cut in
                    { x: -85, y: 30, z: 30 },
                    { x: -68, y: 40, z: 80 },
                    { x: -55, y: 50, z: 80 },//fill cut in
                    { x: -68, y: 40, z: 80 },
                ],
                closed: true,
                fill: true,
                color: white,
            });

            this.frontJetHoleFill = new Zdog.Ellipse({
                addTo: this.anchor,
                diameter: 60,
                stroke: 14,
                fill: true,
                translate: { x: -30, y: 60, z: 35 },
                rotate: { y: TAU / 4 - TAU / 16 },
                color: grey.shadow,
            });

            this.frontJetGroup = new Zdog.Group({
                addTo: this.anchor,
                translate: { x: -60, y: 60, z: 43 },
            });

            this.frontJetMassOffset = new Zdog.Shape({
                addTo: this.frontJetGroup,
                stroke: 14,
                path: [{ x: -200, y: 400, z: 0 }],
                color: red,
                visible: false,
            });

            this.frontJet = new Jet({
                addTo: this.frontJetGroup,
                rotate: { y: TAU / 2 - TAU / 16, z: TAU / 12 },
                scale: 0.7,
            })

            this.bottomJet = new Jet({
                addTo: this.anchor,
                rotate: { z: TAU / 8 },
                translate: { x: 95, y: 75, z: 27 },
                scale: 0.5,
            })

             flipIfRight(this, side);
     
        }//end fuselage

        function Jet(options){
            this.anchor = new Zdog.Anchor(options);

            this.jet = new Zdog.Cone({
                addTo: this.anchor,
                diameter: 60,
                length: 60,
                stroke: 7,
                backface: grey.shadow,
                rotate: { y: TAU / 4 },
                color: grey,
            });
            this.jetConePieces = [];
            for (var i = 0; i < 3; i++){
                this.jetConePieces.push(
                    new Zdog.Ellipse({
                        addTo: this.jet,
                        diameter: 55 + (i * 8),
                        stroke: 11 - i,
                        translate: { z: -7 * i },
                        color: grey,
                    })
                );
            } 
            this.cross = new Zdog.Shape({
                addTo: this.jet,
                stroke: 7,
                path: [
                    { x: 0, y: 0, z: 0 },
                    { x: 0, y: 30, z: 0 },
                    { x: 0, y: -30, z: 0 },
                    { x: 0, y: 0, z: 0 },
                    { x: 30, y: 0, z: 0 },
                    { x: -30, y: 0, z: 0 },
                ],
                closed: false,
                fill: false,
                color: grey,
            });
    
        }//end jet

        function Weapon(options, side){
            this.anchor = new Zdog.Anchor(options);

            this.armA = new Zdog.Shape({
                addTo: this.anchor,
                stroke: 25,
                path: [
                    { x: -30, y: 100, z: 20 },
                    { x: -30, y: 120, z: 20 },
                    { x: -60, y: 175, z: 20 },
                    { x: -100, y: 175, z: 20 },
                    { x: -110, y: 180, z: 20 },
                    { x: -50, y: 180, z: 20 },
                    { x: -55, y: 180, z: 20 },
                    { x: -25, y: 120, z: 20 },
                ],
                closed: true,
                fill: true,
                color: white,
            });
            this.armB = new Zdog.Shape({
                addTo: this.anchor,
                stroke: 14,
                path: [
                    { x: -10, y: 120, z: 20 },
                    { x: -40, y: 185, z: 20 },
                    { x: -20, y: 185, z: 20 },
                ],
                closed: false,
                fill: false,
                color: grey,
            });

            this.gunAnchor = new Zdog.Anchor({
                addTo: this.anchor,
                translate: { x: -50, y: 190, z: 20 },
            });

            this.mainBarrel = new Zdog.Cylinder({
                addTo: this.gunAnchor,
                diameter: 13,
                length: 200,
                stroke: false,
                translate: { x: -70, y: 10 },
                rotate: { y: TAU / 4 },
                color: grey,
                backface: grey.shadow,
            });

            this.sideBarsA = new Zdog.Shape({
                addTo: this.gunAnchor,
                stroke: 14,
                path: [
                    { x: 70, y: 15, z: 10 },
                    { x: 40, y: 0, z: 10 },
                    { x: -45, y: 0, z: 10 },
                    { x: -60, y: 15, z: 10 },
                    { x: -150, y: 15, z: 10 },
                    { x: -160, y: 0, z: 0 },
                    { x: -190, y: 0, z: 0 },//middle point
                    { x: -160, y: 0, z: 0 },
                    { x: -150, y: 15, z: -10 },
                    { x: -60, y: 15, z: -10 },
                    { x: -45, y: 0, z: -10 },
                    { x: 40, y: 0, z: -10 },
                    { x: 70, y: 15, z: -10 },
                ],
                translate: { y: 5 },
                closed: true,
                fill: true,
                color: grey,
            });

            this.sideBarsB = new Zdog.Shape({
                addTo: this.gunAnchor,
                stroke: 14,
                path: [
                    //left side
                    { x: 70, y: 25, z: 15 },
                    { x: 40, y: 10, z: 15 },
                    { x: -20, y: 10, z: 15 },
                    { x: -40, y: 40, z: 15 },
                    { x: -40, y: 55, z: 15 },
                    //right side
                    { x: -40, y: 55, z: -15 },
                    { x: -40, y: 40, z: -15 },
                    { x: -20, y: 10, z: -15 },
                    { x: 40, y: 10, z: -15 },
                    { x: 70, y: 25, z: -15 },
                ],
                translate: { y: 5 },
                closed: true,
                fill: true,
                color: grey,
            });

            this.underBarrel = new Zdog.Cylinder({
                addTo: this.gunAnchor,
                diameter: 15,
                length: 50,
                stroke: false,
                translate: { x: - 110, y: 37 },
                rotate: { y: TAU / 4 },
                color: grey,
                backface: grey.shadow,
            });

            this.underBarrelSlide = new Zdog.Shape({
                addTo: this.gunAnchor,
                stroke: 25,
                path: [
                    { x: -80, y: 40, z: 0 },
                    { x: -80, y: 45, z: 0 },
                    { x: -80, y: 40, z: 0 },
                    { x: -50, y: 50, z: 0 },
                    { x: -30, y: 50, z: 0 },
                    { x: -20, y: 50, z: 0 },
                    { x: -20, y: 40, z: 0 },
                ],
                closed: true,
                fill: true,
                color: white,
            });

            this.ammoCylinder = new Zdog.Cylinder({
                addTo: this.gunAnchor,
                diameter: 50,
                length: 55,
                stroke: 2,
                translate: { x: 10, y: 40 },
                rotate: { y: TAU / 4 },
                color: grey,
            });

            this.gapFill = new Zdog.Shape({
                addTo: this.gunAnchor,
                stroke: 25,
                path: [
                    { x: -70, y: 20 },
                    { x: 10, y: 20 },
                ],
                color: grey,
            });

            flipIfRight(this, side);
    
        }//end weapon

        function flipShape(zdogShape, axis){
            //still kinda wonky, its doesnt like flipping the same shape (or a copy of that shape) twice, and I dont know why
            if (!axis) axis = 'z';
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