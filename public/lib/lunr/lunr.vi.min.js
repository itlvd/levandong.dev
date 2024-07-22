/*!
 * Lunr languages, `Vietnamese` language
 * https://github.com/MihaiValentin/lunr-languages
 *
 * Copyright 2017, Keerati Thiwanruk
 * http://www.mozilla.org/MPL/
 *//*!
 * based on
 * Snowball JavaScript Library v0.3
 * http://code.google.com/p/urim/
 * http://snowball.tartarus.org/
 *
 * Copyright 2010, Oleg Mazko
 * http://www.mozilla.org/MPL/
 */(function(e,t){typeof define=="function"&&define.amd?define(t):typeof exports=="object"?module.exports=t():t()(e.lunr)})(this,function(){return function(e){if("undefined"==typeof e)throw new Error("Lunr is not present. Please include / require Lunr before this script.");if("undefined"==typeof e.stemmerSupport)throw new Error("Lunr stemmer support is not present. Please include / require Lunr stemmer support before this script.");e.vi=function(){this.pipeline.reset(),this.pipeline.add(e.vi.stopWordFilter,e.vi.trimmer)},e.vi.wordCharacters="[A-Za-ẓ̀͐́͑̉̃̓ÂâÊêÔôĂ-ăĐ-đƠ-ơƯ-ư]",e.vi.trimmer=e.trimmerSupport.generateTrimmer(e.vi.wordCharacters),e.Pipeline.registerFunction(e.vi.trimmer,"trimmer-vi"),e.vi.stopWordFilter=e.generateStopWordFilter("là cái nhưng mà".split(" "))}})