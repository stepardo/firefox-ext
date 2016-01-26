if (typeof wallabag == "undefined") {
	var wallabag = {
		_prefs: Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService).getBranch("extensions.wallabag@gaulupeau.fr."),

		installButton: function (toolbarId, id, afterId) {
				if (!document.getElementById(id)) {
						var toolbar = document.getElementById(toolbarId);

						// If no afterId is given, then append the item to the toolbar
						var before = null;
						if (afterId) {
								var elem = document.getElementById(afterId);
								if (elem && elem.parentNode == toolbar)
										before = elem.nextElementSibling;
						}

						toolbar.insertItem(id, before);
						toolbar.setAttribute("currentset", toolbar.currentSet);
						document.persist(toolbar.id, "currentset");

						if (toolbarId == "addon-bar")
								toolbar.collapsed = false;
				}
		},

		post: function(event) {
			var url = content.document.location.href;

			var width = 600;
			var height = 530;
			var left = window.mozInnerScreenX + (window.innerWidth - width) / 2;
			var top = window.mozInnerScreenY + (window.innerHeight - height) / 2;
			if (this._prefs.getBoolPref("usetab")) {
				openAndReuseOneTabPerAttribute("wallabag-tab", this._prefs.getCharPref("url") + "?action=add&url=" + btoa(url));
			} else {
				window.open(this._prefs.getCharPref("url") + "?action=add&url=" + btoa(url), "", "height=" + height + ",width=" + width + ",top=" + top + ", left=" + left + ",toolbar=no,menubar=no,scrollbars=yes,status=no,dialog");
			}
			event.stopPropagation();
		},

		open: function(event) {
			gBrowser.selectedTab = gBrowser.addTab(this._prefs.getCharPref("url"));
			event.stopPropagation();
		}
	};

	window.addEventListener("load", function() {
		Application.getExtensions(function(extensions) {
			var extension = extensions.get("wallabag@gaulupeau.fr");
			if (extension.firstRun) {
				wallabag.installButton("nav-bar", "wallabag-toolbar-button");
			}
		});
	}, false);
}

// function reused from mozilla documentation
// https://developer.mozilla.org/de/docs/Codeschnipsel/Tabbed_browser
function openAndReuseOneTabPerAttribute(attrName, url) {
  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                     .getService(Components.interfaces.nsIWindowMediator);
  for (var found = false, index = 0, tabbrowser = wm.getEnumerator('navigator:browser').getNext().gBrowser;
       index < tabbrowser.tabContainer.childNodes.length && !found;
       index++) {

    // Get the next tab
    var currentTab = tabbrowser.tabContainer.childNodes[index];
  
    // Does this tab contain our custom attribute?
    if (currentTab.hasAttribute(attrName)) {

      // Yes--select and focus it.
      tabbrowser.selectedTab = currentTab;

      // Steffen: also load the new url
      tabbrowser.loadURI(url);

      // Focus *this* browser window in case another one is currently focused
      tabbrowser.ownerDocument.defaultView.focus();
      found = true;
    }
  }

  if (!found) {
    // Our tab isn't open. Open it now.
    var browserEnumerator = wm.getEnumerator("navigator:browser");
    var tabbrowser = browserEnumerator.getNext().gBrowser;
  
    // Create tab
    var newTab = tabbrowser.addTab(url);
    newTab.setAttribute(attrName, "xyz");
  
    // Focus tab
    tabbrowser.selectedTab = newTab;
    
    // Focus *this* browser window in case another one is currently focused
    tabbrowser.ownerDocument.defaultView.focus();
  }
}
