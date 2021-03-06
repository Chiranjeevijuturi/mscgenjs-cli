/* eslint max-len: 0 */
"use strict";

const fs      = require("fs");
const path    = require("path");
const actions = require("../src/actions");
const utl     = require("./testutensils");
const chai    = require("chai");
const expect  = chai.expect;

chai.use(require("chai-xml"));

const testPairs = [
    {
        title : "'-p -i rainbow.mscin tmp_rainbow.json' - produces AST",
        input : {
            options : {
                inputFrom  : "fixtures/rainbow.mscin",
                outputTo   : "output/rainbow_mscgen_source.json",
                outputType : "json"
            }
        },
        expected : "fixtures/rainbow_mscgen_source.json"
    },
    {
        title : "'-T dot -i rainbow.mscin rainbow_mscgen_source.dot' - produces dot",
        input : {
            options : {
                outputType : "dot",
                inputFrom  : "fixtures/rainbow.mscin",
                outputTo   : "output/rainbow_mscgen_source.dot"
            }
        },
        expected : "fixtures/rainbow_mscgen_source.dot"
    },
    {
        title : "'-T doxygen -i rainbow.mscin rainbow_mscgen_source.doxygen' - produces doxygen",
        input : {
            options : {
                outputType : "doxygen",
                inputFrom  : "fixtures/rainbow.mscin",
                outputTo   : "output/rainbow_mscgen_source.doxygen"
            }
        },
        expected : "fixtures/rainbow_mscgen_source.doxygen"
    },
    {
        title : "'-T msgenny -i simpleXuSample.xu -o simpleXuSample.msgenny' - produces mscgen",
        input : {
            options : {
                inputFrom  : "fixtures/simpleXuSample.xu",
                inputType  : "xu",
                outputTo   : "output/simpleXuSample.msgenny",
                outputType : "msgenny"
            }
        },
        expected : "fixtures/simpleXuSample.msgenny"
    },
    {
        title : "'-T msgenny -i rainbow.json -o rainbow.msgenny' - produces mscgen",
        input : {
            options : {
                inputFrom  : "fixtures/simpleXuSample.json",
                inputType  : "json",
                outputTo   : "output/simpleXuSampleToo.msgenny",
                outputType : "msgenny"
            }
        },
        expected : "fixtures/simpleXuSample.msgenny"
    },
    {
        title : "'-T svg -i rainbow.mscin tmp_rainbow.svg' - produces svg",
        input : {
            options : {
                outputTo: "output/rainbow_mscgen_source.svg",
                outputType : "svg",
                inputFrom  : "fixtures/rainbow.mscin"
            }
        },
        expected : "fixtures/rainbow_mscgen_source.svg"
    },
    {
        title : "'-T svg -i rainbow.mscin -s \"svg{font-family:serif}\" custom_style_additions.svg' - produces svg with added styles",
        input : {
            options : {
                outputTo: "output/custom_style_additions.svg",
                outputType : "svg",
                inputFrom  : "fixtures/rainbow.mscin",
                cSs: "svg{font-family:serif}"
            }
        },
        expected : "fixtures/custom_style_additions.svg"
    },
    {
        title : "'-T png -i rainbow.mscin tmp_rainbow.png' - produces png",
        input : {
            options : {
                outputTo: "output/rainbow_mscgen_source.png",
                outputType : "png",
                inputFrom  : "fixtures/rainbow.mscin"
            }
        },
        expected : "fixtures/rainbow_mscgen_source.png"
    },
    {
        title : "'invalid-mscgen.mscin' - produces an error",
        input : {
            options : {
                outputTo: "output/invalid-mscgen.svg",
                outputType : "svg",
                inputFrom  : "fixtures/invalid-mscgen.mscin"
            }
        },
        expected: "whatever",
        expectedError : "SyntaxError"
    },
    {
        title : "'notanast.json' - produces an error",
        input : {
            options : {
                outputTo: "output/notanast.svg",
                outputType : "svg",
                inputFrom  : "fixtures/notanast.json",
                inputType  : "json"
            }
        },
        expected: "whatever",
        expectedError : "Error"
    },
    {
        title : "'non/existing/file.json' - produces an error",
        input : {
            options : {
                outputTo: "output/notanast.svg",
                outputType : "svg",
                inputFrom  : "fixtures/tis/is/really/not/an/existing/file.json",
                inputType  : "json"
            }
        },
        expected: "whatever",
        expectedError : "Error"
    }
    // {
    //     title : "'rainbow.mscin unwritablefile.svg' - shows a write error",
    //     input : {
    //         options : {
    //             outputTo: "/tmp/shouldnt/be/able/to/write/to/thisunwritablefile.svg",
    //             outputType : "svg",
    //             inputFrom  : "fixtures/rainbow.mscin"
    //         }
    //     },
    //     expected : "een dikke vette schrijffout"
    // }
].map(pTestPair => {
    pTestPair.input.options.inputFrom = path.join(__dirname, pTestPair.input.options.inputFrom);
    pTestPair.input.options.outputTo = path.join(__dirname, pTestPair.input.options.outputTo);
    pTestPair.expected = path.join(__dirname, pTestPair.expected);
    return pTestPair;
});

function resetOutputDir(){
    testPairs.forEach(pPair => {
        try {
            // if (!!pPair.input.argument){
            //     fs.unlinkSync(pPair.input.argument);
            // }
            if (Boolean(pPair.input.options.outputTo)){
                fs.unlinkSync(pPair.input.options.outputTo);
            }
        } catch (e){
            // probably files didn't exist in the first place
            // so ignore the exception
        }
    });
}

describe('cli/actions', () => {
    before("set up", () => resetOutputDir());

    after("tear down", () => resetOutputDir());

    describe('#transform()', () => {
        const TEXTTYPES = [
            "dot",
            "doxygen",
            "mscgen",
            "msgenny",
            "xu"
        ];

        testPairs.forEach(pPair => {
            it(pPair.title, done => {
                actions.transform(
                    pPair.input.options
                ).then(() => {
                    if ("svg" === pPair.input.options.outputType){
                        const lFound = fs.readFileSync(pPair.input.options.outputTo, {"encoding" : "utf8"});

                        expect(lFound).xml.to.be.valid();

                        /* Comparing XML's against a fixture won't work -
                         * on different platforms phantomjs will produce
                         * (slightly) different output, so for now we'll
                         * have to be content with valid xml. And a visual
                         * check.
                         */
                        // utl.assertequalFileXML(pPair.input.options.outputTo, pPair.expected);
                    } else if ("png" === pPair.input.options.outputType){
                        const lFoundPng = fs.readFileSync(pPair.input.options.outputTo, {"encoding" : "utf8"});

                        expect(lFoundPng).to.contain("PNG");
                    } else if (TEXTTYPES.indexOf(pPair.input.options.outputType) > -1) {
                        utl.assertequalToFile(
                            pPair.input.options.outputTo,
                            pPair.expected
                        );
                    } else {
                        utl.assertequalFileJSON(
                            pPair.input.options.outputTo,
                            pPair.expected
                        );
                    }
                    done();
                }).catch(e => {
                    done();
                    expect(e.name).to.equal(pPair.expected);
                });
            });
        });
    });
    describe('formatError()', () => {
        it("returns the message of non-syntax errors", () => {
            expect(actions.formatError(new Error('hatsikidee!'))).to.equal('hatsikidee!');
        });

        it("returns man and horse of syntax errors", () => {
            let lErr = new Error('Make my day!');

            lErr.location = {
                start : {
                    line : 481,
                    column : 69
                }
            };

            expect(
                actions.formatError(lErr)
            ).to.equal(`\n  syntax error on line 481, column 69:\n  Make my day!\n\n`);
        });
    });

});
