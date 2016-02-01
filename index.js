var self = require('sdk/self');
var tabs = require('sdk/tabs');
var urls = require('sdk/url');
var workers = require('sdk/content/worker');
var _ = require("sdk/l10n").get;

var {ActionButton} = require('sdk/ui/button/action');
var {openDialog} = require('sdk/window/utils');

var base64 = require('sdk/base64');
var toolbarButton = ActionButton({
    id: 'wallabag-toolbar-button',
    label: 'Bag it!',
    icon: {
        '16': self.data.url('icon-16.png'),
        '32': self.data.url('icon-32.png'),
        '64': self.data.url('icon-64.png')
    }
});

function wallabagBagIt(url) {
    var prefs = require('sdk/simple-prefs').prefs;
    var wallabagUrl = prefs.wallabagUrl;
    var height = prefs.wallabagHeight;
    var width = prefs.wallabagWidth;
    var openTab = prefs.wallabagOpenTab;
    var autoclose = prefs.wallabagAutoclose;
    
    // If the URL is not set in the preferences, open the preference dialog for the add-on.
    if (!wallabagUrl) {
        var notifications = require("sdk/notifications");
        notifications.notify({
            title: _("cfg_msg_title"),
            text: _("cfg_msg_text")
        });
        var am = require("sdk/preferences/utils");
        am.open(self);
        return;
    }
    if (!urls.isValidURI(wallabagUrl)) {
        var notifications = require("sdk/notifications");
        notifications.notify({
            title: _("cfg_msg_title"),
            text: _("cfg_invalid_msg_text")
        });
        var am = require("sdk/preferences/utils");
        am.open(self);
        return;
    }

    var GET = [
        'action=add',
        'url='+base64.encode(url),
    ];

    if (autoclose) {
        GET.push('autoclose=true');
    }

    var features = [
        'height='+height,
        'width='+width,
        'centerscreen=yes',
        'toolbar=no',
        'menubar=no',
        'scrollbars=no',
        'status=no',
        'dialog'
    ];

    var postUrl = wallabagUrl+"?"+GET.join('&');

    if (openTab) {
        if (typeof myTab !== 'undefined') {
            myTab.url = postUrl;
            myTab.activate();
        } else
            tabs.open({
                url: postUrl,
                onOpen: function onOpen(tab)
                {
                    myTab = tab;
                },
                onClose: function onClose(tab)
                {
                    delete myTab;
                }
                });
    } else {
        openDialog({
            url: postUrl,
            features: features.join(',')
        });
    }
}

var wallabag = {
    buttonClick: function wallabagButtonClick(state) {
        var worker = tabs.activeTab.attach({
            contentScriptFile: self.data.url('js/wallabag-get-infos.js')
        });

        worker.port.emit('ping');
        worker.port.on('pong', wallabag.postLink);
    },

    postLink: function wallabagPostLink(linkInfo) {
        var url = linkInfo.wallaUrl;
        var title = linkInfo.wallaTitle;
        var description = linkInfo.wallaDescription;
        wallabagBagIt(url);
    }
};

toolbarButton.on('click', wallabag.buttonClick);

require("sdk/context-menu").Item({
  label: "Bag it!",
  image: self.data.url('icon-16.png'),
  context: require("sdk/context-menu").SelectorContext("a[href]"),
  contentScript: 'self.on("click", function (node, data) {' +
                 '  self.postMessage(node.href);' +
                 '});',
  onMessage: function (pageURL) {
    wallabagBagIt(pageURL);
  }
});
