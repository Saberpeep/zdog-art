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
        
        var yellow = new Color(['#d68846', '#e8b94f', '#f9d76c']),
            brown_light = new Color(['#a46d4e', '#c4a27c', '#d5b693']),
            brown_mid = new Color(['#79482f', '#926c47', '#ac8967']),
            brown_dark =  new Color(['#5b361e', '#805132', '#8b664c']),
            grey = new Color(['#7e6459', '#d7d1d7', '#eef0ef']),
            pink = new Color(['#c47a6b', '#e6b2a7', '#f2ccc3']),
            orange = new Color(['#d87c4e', '#eeae75', '#ffc87e']);

            
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