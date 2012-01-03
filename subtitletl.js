// 取得したTweetを格納するQueueの定義
function Queue() {
    this.__a = new Array();
}
Queue.prototype.enqueue = function(o) {
    this.__a.push(o);
}
Queue.prototype.dequeue = function() {
    if( this.__a.length > 0 ) {
        return this.__a.shift();
    }
    return null;
}
Queue.prototype.size = function() {
    return this.__a.length;
}
Queue.prototype.toString = function() {
    return '[' + this.__a.join(',') + ']';
}

$(document).ready(function(){

    // Tweetを格納するキュー
    var que = new Queue();
    var lastID = null;
    var isEnable = false;

    // Tweetを読み込んでキューに格納
    function pushTweets(q) {
        var url =
            lastID ? 
            "http://search.twitter.com/search.json?q=" + encodeURIComponent(q) + "&since_id=" + lastID + "&callback=?" :
            "http://search.twitter.com/search.json?q=" + encodeURIComponent(q) + "&rpp=10&callback=?";

        chrome.extension.sendRequest(
            {action:'getJSON', url:url}, 
            function(json) {
                $(json.results.reverse()).each(function() {
                    if (this.id == undefined) return;
                    lastID = this.id.toString().replace("tweet", "");
                    que.enqueue(this);
                });
            });
    }

    function pullTweets() {
        var tweet = que.dequeue();
        if (tweet != null) {
            var tweetText =
                "<p style='line-height:66px;'>" +
                "<img width='32' height='32' src='" +
                tweet.profile_image_url +
                "' />" +
                tweet.from_user_name +
                ":" +
                tweet.text +
                "</p>";
            $("#subtitletl").html(tweetText);
        }
    }

    chrome.extension.onRequest.addListener(
        function(request, sender, sendResponse) {
            if (request.isView) {
                if (!isEnable) {
                    $("#subtitletl").css('display', 'block');
                    pushTweets(request.q);
                    pullTweets();
                    // Tweet取得タイマーイベント
                    $(document).everyTime(60000, 'pushTimer', function(){pushTweets(request.q);});
                    // Tweet読み込みタイマーイベント
                    $(document).everyTime(10000, 'pullTimer', function(){pullTweets();});
                }
                isEnable = true;
            } else {
                if (isEnable) {
                    $("#subtitletl").css('display', 'none');
                    // Tweet取得タイマーイベント
                    $(document).everyTime(60000, 'pushTimer', function(){});
                    // Tweet読み込みタイマーイベント
                    $(document).everyTime(10000, 'pullTimer', function(){});
                }
                isEnable = false;
                lastID = null;
            }
            sendResponse({isEnable: isEnable});
        });

    // 字幕用要素の付与
    $("body").prepend("<div id='subtitletl'></div>");
    // 字幕のスタイル
    $("#subtitletl").css({
    opacity: '0.8',
    display: 'none',
    position: 'absolute',
    left: '0',
    bottom: '0',
    width: '100%',
    height: '100px',
    background: '#000',
    color: '#fff',
    zIndex: '1',
    textAlign: 'center',
    verticalAlign: 'middle',
    fontSize: '20px'
    });

});
