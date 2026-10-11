package `in`.wohotech.browser.android

import android.app.Activity
import android.app.AlertDialog
import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.view.Gravity
import android.view.View
import android.view.inputmethod.EditorInfo
import android.webkit.SslErrorHandler
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.Toast
import android.net.http.SslError
import java.net.URI

class MainActivity : Activity() {
    private data class BrowserTab(val id: Int, val webView: WebView, var title: String = "New tab")
    private val tabs = mutableListOf<BrowserTab>()
    private var nextTabId = 1
    private var activeTabId: Int? = null
    private lateinit var addressBar: EditText
    private lateinit var tabStrip: LinearLayout
    private lateinit var webHost: FrameLayout
    private lateinit var progress: ProgressBar
    private lateinit var bookmarkButton: Button
    private lateinit var securityStatus: android.widget.TextView
    private val preferences by lazy { getSharedPreferences("browser-local-data", Context.MODE_PRIVATE) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        buildUi()
        openTab("https://www.google.com")
    }

    private fun buildUi() {
        val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(8), dp(8), dp(8), dp(4)) }
        val addressRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        addressBar = EditText(this).apply {
            setSingleLine(true); hint = "Search or enter address"; imeOptions = EditorInfo.IME_ACTION_GO
            contentDescription = "Address and search"; setTextSize(14f); setPadding(dp(10), dp(4), dp(10), dp(4))
            setOnEditorActionListener { _, actionId, _ ->
                if (actionId == EditorInfo.IME_ACTION_GO || actionId == EditorInfo.IME_ACTION_DONE) { navigateFromAddress(); true } else false
            }
        }
        addressRow.addView(addressBar, LinearLayout.LayoutParams(0, dp(48), 1f))
        addressRow.addView(button("Go", "Navigate to address") { navigateFromAddress() })
        addressRow.addView(button("+", "Open new tab") { openTab("https://www.google.com") })
        root.addView(addressRow)
        securityStatus = android.widget.TextView(this).apply {
            text = "No page loaded"
            textSize = 11f
            setPadding(dp(6), dp(2), dp(6), dp(2))
            contentDescription = "Connection security status"
        }
        root.addView(securityStatus, LinearLayout.LayoutParams(-1, dp(22)))

        val tabsScroll = HorizontalScrollView(this).apply { isHorizontalScrollBarEnabled = false; contentDescription = "Open browser tabs" }
        tabStrip = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        tabsScroll.addView(tabStrip)
        root.addView(tabsScroll, LinearLayout.LayoutParams(-1, dp(42)))

        progress = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply { max = 100; visibility = View.GONE; contentDescription = "Page loading progress" }
        root.addView(progress, LinearLayout.LayoutParams(-1, dp(3)))
        webHost = FrameLayout(this)
        root.addView(webHost, LinearLayout.LayoutParams(-1, 0, 1f))

        val controls = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER }
        controls.addView(button("‹", "Go back") { activeWebView()?.let { if (it.canGoBack()) it.goBack() } })
        controls.addView(button("›", "Go forward") { activeWebView()?.let { if (it.canGoForward()) it.goForward() } })
        controls.addView(button("↻", "Reload page") { activeWebView()?.reload() })
        controls.addView(button("History", "Show recent browsing history") { showHistory() })
        bookmarkButton = button("☆", "Save current bookmark") { saveCurrentBookmark() }
        controls.addView(bookmarkButton)
        controls.addView(button("Bookmarks", "Show saved bookmarks") { showBookmarks() })
        root.addView(controls)
        setContentView(root)
    }

    private fun button(label: String, description: String, action: () -> Unit): Button =
        Button(this).apply { text = label; contentDescription = description; isAllCaps = false; setPadding(dp(8), 0, dp(8), 0); setOnClickListener { action() } }

    private fun openTab(initialUrl: String) {
        val webView = WebView(this)
        configureWebView(webView)
        val tab = BrowserTab(nextTabId++, webView)
        tabs.add(tab)
        switchToTab(tab.id)
        webView.loadUrl(initialUrl)
        renderTabStrip()
    }

    private fun configureWebView(webView: WebView) {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(false)
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            safeBrowsingEnabled = true
            loadsImagesAutomatically = true
        }
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url.toString()
                if (BrowserUrlPolicy.isAllowedUrl(url)) return false
                Toast.makeText(this@MainActivity, "Only HTTP and HTTPS pages are allowed.", Toast.LENGTH_SHORT).show()
                return true
            }
            override fun onPageStarted(view: WebView, url: String, favicon: android.graphics.Bitmap?) {
                if (view === activeWebView()) { addressBar.setText(url); progress.visibility = View.VISIBLE; progress.progress = 0; updateSecurityStatus(url) }
                updateActiveBookmarkButton()
            }
            override fun onPageFinished(view: WebView, url: String) {
                val tab = tabs.firstOrNull { it.webView === view } ?: return
                tab.title = view.title?.take(80)?.ifBlank { null } ?: url
                if (tab.id == activeTabId) { addressBar.setText(url); progress.visibility = View.GONE; updateActiveBookmarkButton(); updateSecurityStatus(url) }
                renderTabStrip()
                if (BrowserUrlPolicy.isAllowedUrl(url)) saveHistory(tab.title, url)
            }
            override fun onReceivedSslError(view: WebView, handler: SslErrorHandler, error: SslError) {
                handler.cancel()
                Toast.makeText(this@MainActivity, "Secure connection failed. Navigation was blocked.", Toast.LENGTH_LONG).show()
            }
        }
        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView, newProgress: Int) {
                if (view === activeWebView()) { progress.progress = newProgress; progress.visibility = if (newProgress >= 100) View.GONE else View.VISIBLE }
            }
        }
        webView.setDownloadListener { url, userAgent, contentDisposition, mimeType, _ -> startDownload(url, userAgent, contentDisposition, mimeType) }
    }

    private fun navigateFromAddress() {
        val destination = BrowserUrlPolicy.normalizeAddressInput(addressBar.text.toString())
        if (destination == null) { Toast.makeText(this, "Enter a valid HTTP/HTTPS URL or search phrase.", Toast.LENGTH_SHORT).show(); return }
        activeWebView()?.loadUrl(destination)
        addressBar.clearFocus()
    }

    private fun switchToTab(id: Int) {
        val tab = tabs.firstOrNull { it.id == id } ?: return
        activeTabId = id
        webHost.removeAllViews()
        (tab.webView.parent as? android.view.ViewGroup)?.removeView(tab.webView)
        webHost.addView(tab.webView, FrameLayout.LayoutParams(-1, -1))
        addressBar.setText(tab.webView.url.orEmpty())
        updateSecurityStatus(tab.webView.url.orEmpty())
        renderTabStrip()
        updateActiveBookmarkButton()
    }

    private fun closeTab(id: Int) {
        val index = tabs.indexOfFirst { it.id == id }
        if (index < 0) return
        val wasActive = activeTabId == id
        val tab = tabs.removeAt(index)
        webHost.removeView(tab.webView)
        tab.webView.stopLoading()
        tab.webView.destroy()
        if (tabs.isEmpty()) { activeTabId = null; openTab("https://www.google.com") }
        else if (wasActive) switchToTab(tabs[(index - 1).coerceAtLeast(0)].id)
        renderTabStrip()
    }

    private fun renderTabStrip() {
        if (!::tabStrip.isInitialized) return
        tabStrip.removeAllViews()
        for (tab in tabs) {
            val group = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
            val select = button(tab.title.take(18), "Switch to tab: " + tab.title) { switchToTab(tab.id) }
            select.textSize = 12f
            group.addView(select)
            group.addView(button("×", "Close tab: " + tab.title) { closeTab(tab.id) })
            if (tab.id == activeTabId) group.setBackgroundColor(0xFFE3ECFA.toInt())
            tabStrip.addView(group, LinearLayout.LayoutParams(-2, dp(40)))
        }
    }

    private fun activeWebView(): WebView? = tabs.firstOrNull { it.id == activeTabId }?.webView

    private fun updateSecurityStatus(url: String) {
        if (!::securityStatus.isInitialized) return
        when {
            url.startsWith("https://", ignoreCase = true) -> {
                securityStatus.text = "HTTPS · Secure transport"
                securityStatus.setTextColor(0xFF287A48.toInt())
            }
            url.startsWith("http://", ignoreCase = true) -> {
                securityStatus.text = "HTTP · Not secure"
                securityStatus.setTextColor(0xFFB3261E.toInt())
            }
            else -> {
                securityStatus.text = "No website loaded"
                securityStatus.setTextColor(0xFF555555.toInt())
            }
        }
    }

    private fun saveCurrentBookmark() {
        val webView = activeWebView() ?: return
        val url = webView.url ?: return
        if (!BrowserUrlPolicy.isAllowedUrl(url)) return
        val bookmarks = readRecords("bookmarks")
        val existingIndex = (0 until bookmarks.length()).firstOrNull { bookmarks.optJSONObject(it)?.optString("url") == url }
        if (existingIndex != null) {
            val updated = org.json.JSONArray()
            for (i in 0 until bookmarks.length()) if (i != existingIndex) updated.put(bookmarks.getJSONObject(i))
            preferences.edit().putString("bookmarks", boundedJson(updated, 5000)).apply()
            updateActiveBookmarkButton()
            Toast.makeText(this, "Bookmark removed from this device.", Toast.LENGTH_SHORT).show()
            return
        }
        bookmarks.put(org.json.JSONObject().put("title", webView.title.orEmpty().take(512).ifBlank { url }).put("url", url))
        preferences.edit().putString("bookmarks", boundedJson(bookmarks, 5000)).apply()
        updateActiveBookmarkButton()
        Toast.makeText(this, "Bookmark saved on this device.", Toast.LENGTH_SHORT).show()
    }

    private fun updateActiveBookmarkButton() {
        if (!::bookmarkButton.isInitialized) return
        val url = activeWebView()?.url
        bookmarkButton.text = if (url != null && (0 until readRecords("bookmarks").length()).any { readRecords("bookmarks").optJSONObject(it)?.optString("url") == url }) "★" else "☆"
    }

    private fun showBookmarks() {
        val records = readRecords("bookmarks")
        if (records.length() == 0) { AlertDialog.Builder(this).setTitle("Bookmarks").setMessage("No bookmarks saved yet.").setPositiveButton("OK", null).show(); return }
        val labels = Array(records.length()) { i -> records.optJSONObject(i)?.optString("title").orEmpty().ifBlank { records.optJSONObject(i)?.optString("url").orEmpty() } }
        AlertDialog.Builder(this).setTitle("Bookmarks").setItems(labels) { _, which ->
            val url = records.optJSONObject(which)?.optString("url").orEmpty()
            if (BrowserUrlPolicy.isAllowedUrl(url)) activeWebView()?.loadUrl(url)
        }.setNegativeButton("Close", null).show()
    }

    private fun showHistory() {
        val records = readRecords("history")
        if (records.length() == 0) {
            AlertDialog.Builder(this).setTitle("History").setMessage("No browsing history is saved on this device.")
                .setPositiveButton("OK", null).show()
            return
        }
        val start = (records.length() - 100).coerceAtLeast(0)
        val recent = (start until records.length()).reversed().mapNotNull { records.optJSONObject(it) }
        val labels = recent.map { record ->
            val title = record.optString("title").ifBlank { record.optString("url") }.take(60)
            val host = try { URI(record.optString("url")).host.orEmpty() } catch (_: Exception) { "" }
            if (host.isBlank()) title else "$title — $host"
        }.toTypedArray()
        AlertDialog.Builder(this).setTitle("Recent history").setItems(labels) { _, which ->
            val url = recent.getOrNull(which)?.optString("url").orEmpty()
            if (BrowserUrlPolicy.isAllowedUrl(url)) activeWebView()?.loadUrl(url)
        }.setNeutralButton("Clear history") { _, _ ->
            preferences.edit().remove("history").apply()
            Toast.makeText(this, "Browsing history cleared from this device.", Toast.LENGTH_SHORT).show()
        }.setNegativeButton("Close", null).show()
    }

    private fun saveHistory(title: String, url: String) {
        val history = readRecords("history")
        if (history.length() > 0 && history.optJSONObject(history.length() - 1)?.optString("url") == url) return
        history.put(org.json.JSONObject().put("title", title.take(512)).put("url", url).put("visitedAt", System.currentTimeMillis()))
        val start = (history.length() - 500).coerceAtLeast(0)
        val bounded = org.json.JSONArray()
        for (i in start until history.length()) bounded.put(history.getJSONObject(i))
        preferences.edit().putString("history", bounded.toString()).apply()
    }

    private fun readRecords(key: String): org.json.JSONArray {
        val raw = preferences.getString(key, "[]") ?: "[]"
        if (raw.length > 2_000_000) return org.json.JSONArray()
        return try {
            val parsed = org.json.JSONArray(raw)
            val bounded = org.json.JSONArray()
            val start = (parsed.length() - 5000).coerceAtLeast(0)
            for (i in start until parsed.length()) {
                val item = parsed.optJSONObject(i) ?: continue
                if (BrowserUrlPolicy.isAllowedUrl(item.optString("url"))) bounded.put(item)
            }
            bounded
        } catch (_: Exception) { org.json.JSONArray() }
    }

    private fun boundedJson(records: org.json.JSONArray, maximum: Int): String {
        val bounded = org.json.JSONArray()
        val start = (records.length() - maximum).coerceAtLeast(0)
        for (i in start until records.length()) {
            val item = records.optJSONObject(i) ?: continue
            if (BrowserUrlPolicy.isAllowedUrl(item.optString("url"))) bounded.put(item)
        }
        return bounded.toString()
    }

    private fun startDownload(url: String, userAgent: String, contentDisposition: String, mimeType: String) {
        if (!BrowserUrlPolicy.isAllowedUrl(url)) { Toast.makeText(this, "Download URL was blocked.", Toast.LENGTH_SHORT).show(); return }
        try {
            val guessed = android.webkit.URLUtil.guessFileName(url, contentDisposition, mimeType).replace(Regex("[^A-Za-z0-9._ -]"), "_").take(120).ifBlank { "download" }
            val request = DownloadManager.Request(Uri.parse(url)).apply {
                setTitle(guessed)
                setDescription("Download from " + (URI(url).host ?: "website"))
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                setAllowedOverMetered(true)
                setAllowedOverRoaming(false)
                addRequestHeader("User-Agent", userAgent.replace(Regex("[\\r\\n]"), "").take(512))
                setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, guessed)
            }
            (getSystemService(DOWNLOAD_SERVICE) as DownloadManager).enqueue(request)
            Toast.makeText(this, "Download started. Check notifications for progress.", Toast.LENGTH_SHORT).show()
        } catch (_: Exception) { Toast.makeText(this, "Could not start this download.", Toast.LENGTH_LONG).show() }
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    @Deprecated("Deprecated in Android 13; retained for hardware back compatibility")
    override fun onBackPressed() {
        val webView = activeWebView()
        if (webView?.canGoBack() == true) webView.goBack()
        else if (tabs.size > 1) closeTab(activeTabId ?: return)
        else super.onBackPressed()
    }

    override fun onDestroy() {
        tabs.toList().forEach { tab ->
            tab.webView.stopLoading()
            (tab.webView.parent as? android.view.ViewGroup)?.removeView(tab.webView)
            tab.webView.destroy()
        }
        tabs.clear()
        super.onDestroy()
    }
}
