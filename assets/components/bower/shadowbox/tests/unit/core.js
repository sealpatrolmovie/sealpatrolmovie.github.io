module("core");

test("Basic Requirements", function() {
    expect(4);
    ok(Array.prototype.push, "Array.push");
    ok(document.getElementById, "getElementById");
    ok(document.getElementsByTagName, "getElementsByTagName");
    ok(RegExp, "RegExp");
});

test("getPlayer", function() {
    var g = Shadowbox.getPlayer;

    // flv
    equal(g("movie.flv"), "flv", ".flv extension");
    equal(g("movie.m4v"), "flv", ".m4v extension");

    // inline & iframe
    var h = document.location.href;
    equal(g(h), "iframe", "same document");
    equal(g(h + '#id'), "inline", "same document with hash");
    equal(g('/'), "iframe", "same domain, root document");
    equal(g('/#name'), "iframe", "same domain, root document with hash");
    equal(g('/index.html'), "iframe", "same domain, external document");
    equal(g('/index.html#name'), "iframe", "same domain, external document with hash");

    // img
    equal(g("some.bmp"), "img", ".bmp extension");
    equal(g("some.gif"), "img", ".gif extension");
    equal(g("some.jpg"), "img", ".jpg extension");
    equal(g("some.jpeg"), "img", ".jpeg extension");
    equal(g("some.png"), "img", ".png extension");

    // qt
    equal(g("movie.dv"), "qt", ".dv extension");
    equal(g("movie.mov"), "qt", ".mov extension");
    equal(g("movie.moov"), "qt", ".moov extension");
    equal(g("movie.movie"), "qt", ".movie extension");
    equal(g("movie.mp4"), "qt", ".mp4 extension");

    // swf
    equal(g("movie.swf"), "swf", ".swf extension");

    // wmp
    equal(g("movie.asf"), "wmp", ".asf extension");
    equal(g("movie.wm"), "wmp", ".wm extension");
    equal(g("movie.wmv"), "wmp", ".wmv extension");

    // qtwmp
    equal(g("movie.avi"), "qtwmp", ".avi extension");
    equal(g("movie.mpg"), "qtwmp", ".mpg extension");
    equal(g("movie.mpeg"), "qtwmp", ".mpeg extension");
});

test("setDimensions", function() {
    var dims;

    // perfect fit
    dims = Shadowbox.setDimensions(100, 100, 100, 100, 0, 0, 0);
    equal(dims.height, 100);
    equal(dims.width, 100);
    equal(dims.innerHeight, 100);
    equal(dims.innerWidth, 100);
    equal(dims.top, 0);
    equal(dims.left, 0);
    equal(dims.oversized, false);

    // oversized
    dims = Shadowbox.setDimensions(100, 200, 50, 50, 0, 0, 0);
    equal(dims.height, 25);
    equal(dims.width, 50);
    equal(dims.innerHeight, 25);
    equal(dims.innerWidth, 50);
    equal(dims.top, 12);
    equal(dims.left, 0);
    equal(dims.oversized, true);
});

test("makeGallery (automatic)", function() {
    Shadowbox.setup();
    var link3 = document.getElementById("link3");
    var link4 = document.getElementById("link4");
    var gc = Shadowbox.makeGallery(link3);
    var gallery = gc[0];
    var current = gc[1];
    equal(gallery[0].link, link3);
    equal(gallery[1].link, link4);
    Shadowbox.clearCache();
});

test("makeGallery (manual)", function() {
    var link3 = document.getElementById("link3");
    var gc = Shadowbox.makeGallery(link3);
    var gallery = gc[0];
    var current = gc[1];
    equal(gallery[0].link, link3);
});

test("makeObject", function() {
    var link1 = document.getElementById("link1");
    var obj = Shadowbox.makeObject(link1);
    ok(obj.content, "HREF parsed");
    equal(obj.title, "My Image", "Title parsed correctly");
    equal(obj.gallery, null, "Does not belong to a gallery");
});
