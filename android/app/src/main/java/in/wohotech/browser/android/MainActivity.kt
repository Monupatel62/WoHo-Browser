package `in`.wohotech.browser.android

import android.app.Activity
import android.app.AlertDialog
import android.app.DownloadManager
import android.content.Context
import android.content.Intent
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
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.Toast
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
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
    private val corruptRecordKeys = mutableSetOf<String>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        buildUi()
        // Migrate legacy history URLs before any browsing so query/fragment
        // tokens are not retained on disk merely because History was not opened.
        readRecords("history")
        openTab("https://www.google.com")
    }

    private fun buildUi() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val isDark = (resources.configuration.uiMode and android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES
        val palette = if (isDark) BrowserPalette.Dark else BrowserPalette.Light
        window.statusBarColor = palette.background
        window.navigationBarColor = palette.background
        WindowCompat.getInsetsController(window, window.decorView).isAppearanceLightStatusBars = !isDark
        WindowCompat.getInsetsController(window, window.decorView).isAppearanceLightNavigationBars = !isDark

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(12), dp(8), dp(12), dp(8))
            setBackgroundColor(palette.background)
        }
        ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(dp(12) + bars.left, dp(8) + bars.top, dp(12) + bars.right, dp(8) + bars.bottom)
            insets
        }

        val brandRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(4), dp(2), dp(4), dp(6))
            contentDescription = "WoHo Browser brand"
        }
        val brandIcon = ImageView(this).apply {
            setImageResource(R.drawable.ic_woho_browser)
            contentDescription = "WoHo Browser logo"
            scaleType = android.widget.ImageView.ScaleType.FIT_CENTER
        }
        brandRow.addView(brandIcon, LinearLayout.LayoutParams(dp(28), dp(28)))
        val brandText = android.widget.TextView(this).apply {
            text = "WoHo Browser"
            textSize = 16f
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            setTextColor(palette.text)
            setPadding(dp(8), 0, 0, 0)
            contentDescription = "WoHo Browser"
        }
        brandRow.addView(brandText, LinearLayout.LayoutParams(-2, dp(32)))
        val brandSpacer = View(this)
        brandRow.addView(brandSpacer, LinearLayout.LayoutParams(0, dp(1), 1f))
        val brandCaption = android.widget.TextView(this).apply {
            text = "PRIVATE & FAST"
            textSize = 9f
            letterSpacing = 0.08f
            setTextColor(palette.muted)
        }
        brandRow.addView(brandCaption)
        root.addView(brandRow, LinearLayout.LayoutParams(-1, dp(36)))

        val addressRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        addressBar = EditText(this).apply {
            setSingleLine(true)
            hint = "Search or enter address"
            imeOptions = EditorInfo.IME_ACTION_GO
            contentDescription = "Address and search"
            setTextSize(14f)
            setTextColor(palette.text)
            setHintTextColor(palette.muted)
            setPadding(dp(16), 0, dp(12), 0)
            background = roundedBackground(palette.surface, palette.outline, dp(24))
            setSelectAllOnFocus(false)
            setOnEditorActionListener { _, actionId, _ ->
                if (actionId == EditorInfo.IME_ACTION_GO || actionId == EditorInfo.IME_ACTION_DONE) { navigateFromAddress(); true } else false
            }
        }
        val addressParams = LinearLayout.LayoutParams(0, dp(48), 1f).apply { marginEnd = dp(8) }
        addressRow.addView(addressBar, addressParams)
        addressRow.addView(button("Go", "Navigate to address", primary = true) { navigateFromAddress() })
        val addTab = button("+", "Open new tab") { openTab("https://www.google.com") }
        val addParams = LinearLayout.LayoutParams(dp(48), dp(48)).apply { marginStart = dp(6) }
        addressRow.addView(addTab, addParams)
        root.addView(addressRow)

        securityStatus = android.widget.TextView(this).apply {
            text = "Ready to browse"
            textSize = 11f
            setPadding(dp(12), dp(4), dp(12), dp(4))
            contentDescription = "Connection security status"
            setTextColor(palette.muted)
        }
        root.addView(securityStatus, LinearLayout.LayoutParams(-1, dp(24)))

        val tabsScroll = HorizontalScrollView(this).apply {
            isHorizontalScrollBarEnabled = false
            contentDescription = "Open browser tabs"
            clipToPadding = false
            setPadding(0, dp(2), 0, dp(6))
        }
        tabStrip = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        tabsScroll.addView(tabStrip)
        root.addView(tabsScroll, LinearLayout.LayoutParams(-1, dp(52)))

        progress = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 100
            visibility = View.GONE
            contentDescription = "Page loading progress"
            progressTintList = android.content.res.ColorStateList.valueOf(palette.accent)
        }
        root.addView(progress, LinearLayout.LayoutParams(-1, dp(3)))
        webHost = FrameLayout(this).apply {
            setBackgroundColor(palette.surface)
            background = roundedBackground(palette.surface, palette.outline, dp(16))
            clipToOutline = true
        }
        val webParams = LinearLayout.LayoutParams(-1, 0, 1f).apply {
            topMargin = dp(4)
            bottomMargin = dp(8)
        }
        root.addView(webHost, webParams)

        val controlsScroll = HorizontalScrollView(this).apply {
            isHorizontalScrollBarEnabled = false
            clipToPadding = false
            contentDescription = "Browser navigation toolbar"
        }
        val controls = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        controls.addView(toolbarButton("‹", "Back") { activeWebView()?.let { if (it.canGoBack()) it.goBack() } })
        controls.addView(toolbarButton("›", "Forward") { activeWebView()?.let { if (it.canGoForward()) it.goForward() } })
        controls.addView(toolbarButton("↻", "Reload") { activeWebView()?.reload() })
        controls.addView(toolbarButton("History", "History") { showHistory() })
        bookmarkButton = toolbarButton("☆", "Bookmark") { saveCurrentBookmark() }
        controls.addView(bookmarkButton)
        controls.addView(toolbarButton("Saved", "Bookmarks") { showBookmarks() })
        controlsScroll.addView(controls)
        root.addView(controlsScroll, LinearLayout.LayoutParams(-1, dp(52)))
        setContentView(root)
    }

    private fun currentPalette(): PaletteTheme {
        val isDark = (resources.configuration.uiMode and android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES
        return if (isDark) BrowserPalette.Dark else BrowserPalette.Light
    }

    private fun button(label: String, description: String, primary: Boolean = false, action: () -> Unit): Button {
        val palette = currentPalette()
        return Button(this).apply {
            text = label
            contentDescription = description
            isAllCaps = false
            textSize = 13f
            minWidth = dp(if (primary) 58 else 48)
            minimumWidth = dp(if (primary) 58 else 48)
            minHeight = dp(48)
            minimumHeight = dp(48)
            setPadding(dp(12), 0, dp(12), 0)
            setTextColor(if (primary) palette.onAccent else palette.text)
            background = roundedBackground(if (primary) palette.accent else palette.surface, if (primary) palette.accent else palette.outline, dp(16))
            stateListAnimator = null
            setOnClickListener { action() }
        }
    }

    private fun toolbarButton(label: String, description: String, action: () -> Unit): Button {
        val palette = currentPalette()
        return Button(this).apply {
            text = label
            contentDescription = description
            isAllCaps = false
            textSize = if (label.length > 2) 11f else 22f
            minWidth = dp(if (label.length > 2) 72 else 48)
            minimumWidth = dp(if (label.length > 2) 72 else 48)
            minHeight = dp(48)
            minimumHeight = dp(48)
            setPadding(dp(8), 0, dp(8), 0)
            setTextColor(palette.text)
            background = roundedBackground(palette.surface, palette.outline, dp(14))
            stateListAnimator = null
            val params = LinearLayout.LayoutParams(-2, dp(48)).apply { marginEnd = dp(6) }
            layoutParams = params
            setOnClickListener { action() }
        }
    }

    private fun roundedBackground(fill: Int, stroke: Int, radius: Int): android.graphics.drawable.GradientDrawable =
        android.graphics.drawable.GradientDrawable().apply {
            setColor(fill)
            cornerRadius = radius.toFloat()
            setStroke(dp(1), stroke)
        }

    interface PaletteTheme {
        val background: Int
        val surface: Int
        val text: Int
        val muted: Int
        val outline: Int
        val accent: Int
        val onAccent: Int
    }

    private object BrowserPalette {
        val Light = object : PaletteTheme {
            override val background = 0xFFF3F5FA.toInt()
            override val surface = 0xFFFFFFFF.toInt()
            override val text = 0xFF141926.toInt()
            override val muted = 0xFF5D6B82.toInt()
            override val outline = 0xFFD8E0ED.toInt()
            override val accent = 0xFF2457D6.toInt()
            override val onAccent = 0xFFFFFFFF.toInt()
        }

        val Dark = object : PaletteTheme {
            override val background = 0xFF0D121F.toInt()
            override val surface = 0xFF151C2C.toInt()
            override val text = 0xFFE9EDF5.toInt()
            override val muted = 0xFF8E9BAE.toInt()
            override val outline = 0xFF2A354A.toInt()
            override val accent = 0xFF4D7DF5.toInt()
            override val onAccent = 0xFFFFFFFF.toInt()
        }
    }

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
        val palette = currentPalette()
        for (tab in tabs) {
            val active = tab.id == activeTabId
            val group = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                background = roundedBackground(if (active) palette.surface else palette.background, if (active) palette.accent else palette.outline, dp(14))
                setPadding(dp(4), 0, dp(4), 0)
            }
            val select = Button(this).apply {
                text = tab.title.take(16).ifBlank { "New tab" }
                contentDescription = "Switch to tab: " + tab.title
                isAllCaps = false
                textSize = 12f
                minWidth = dp(84)
                minimumWidth = dp(84)
                minHeight = dp(44)
                minimumHeight = dp(44)
                setPadding(dp(10), 0, dp(8), 0)
                setTextColor(if (active) palette.accent else palette.text)
                background = android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT)
                stateListAnimator = null
                setOnClickListener { switchToTab(tab.id) }
            }
            group.addView(select)
            val close = Button(this).apply {
                text = "×"
                contentDescription = "Close tab: " + tab.title
                isAllCaps = false
                textSize = 18f
                minWidth = dp(40)
                minimumWidth = dp(40)
                minHeight = dp(44)
                minimumHeight = dp(44)
                setTextColor(palette.muted)
                background = android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT)
                stateListAnimator = null
                setOnClickListener { closeTab(tab.id) }
            }
            group.addView(close)
            val params = LinearLayout.LayoutParams(-2, dp(46)).apply { marginEnd = dp(8) }
            tabStrip.addView(group, params)
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
        if ("bookmarks" in corruptRecordKeys) { showCorruptRecordsWarning("bookmarks"); return }
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
        val bookmarks = readRecords("bookmarks")
        bookmarkButton.text = if (url != null && (0 until bookmarks.length()).any { bookmarks.optJSONObject(it)?.optString("url") == url }) "★" else "☆"
    }

    private fun showBookmarks() {
        val records = readRecords("bookmarks")
        if ("bookmarks" in corruptRecordKeys) { showCorruptRecordsWarning("bookmarks"); return }
        if (records.length() == 0) { AlertDialog.Builder(this).setTitle("Bookmarks").setMessage("No bookmarks saved yet.").setPositiveButton("OK", null).show(); return }
        val labels = Array(records.length()) { i -> records.optJSONObject(i)?.optString("title").orEmpty().ifBlank { records.optJSONObject(i)?.optString("url").orEmpty() } }
        AlertDialog.Builder(this).setTitle("Bookmarks").setItems(labels) { _, which ->
            val url = records.optJSONObject(which)?.optString("url").orEmpty()
            if (BrowserUrlPolicy.isAllowedUrl(url)) activeWebView()?.loadUrl(url)
        }.setNegativeButton("Close", null).show()
    }

    private fun showHistory() {
        val records = readRecords("history")
        if ("history" in corruptRecordKeys) { showCorruptRecordsWarning("history"); return }
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
        // Keep the live URL untouched, but never persist query/fragment values
        // that may contain signed links, search terms, or access tokens.
        val safeUrl = BrowserUrlPolicy.sanitizeHistoryUrl(url) ?: return
        val history = readRecords("history")
        if ("history" in corruptRecordKeys) { showCorruptRecordsWarning("history"); return }
        if (history.length() > 0 && history.optJSONObject(history.length() - 1)?.optString("url") == safeUrl) return
        history.put(org.json.JSONObject().put("title", title.take(512)).put("url", safeUrl).put("visitedAt", System.currentTimeMillis()))
        val start = (history.length() - 500).coerceAtLeast(0)
        val bounded = org.json.JSONArray()
        for (i in start until history.length()) bounded.put(history.getJSONObject(i))
        preferences.edit().putString("history", bounded.toString()).apply()
    }

    private fun readRecords(key: String): org.json.JSONArray {
        if (key in corruptRecordKeys) return org.json.JSONArray()
        val raw = try {
            preferences.getString(key, "[]") ?: "[]"
        } catch (_: ClassCastException) {
            // A corrupted or legacy value with the wrong SharedPreferences type
            // must be treated as damaged data, not allowed to crash the browser.
            corruptRecordKeys.add(key)
            return org.json.JSONArray()
        }
        val parsed = LocalRecordsPolicy.parseRecords(raw)
        if (parsed == null) {
            corruptRecordKeys.add(key)
            return org.json.JSONArray()
        }
        return try {
            val bounded = org.json.JSONArray()
            val start = (parsed.length() - 5000).coerceAtLeast(0)
            var historyNeedsRedaction = false
            for (i in start until parsed.length()) {
                val item = parsed.optJSONObject(i) ?: continue
                val rawUrl = item.optString("url")
                val safeUrl = if (key == "history") BrowserUrlPolicy.sanitizeHistoryUrl(rawUrl) else rawUrl.takeIf(BrowserUrlPolicy::isAllowedUrl)
                if (safeUrl != null) {
                    if (key == "history" && safeUrl != rawUrl) {
                        item.put("url", safeUrl)
                        historyNeedsRedaction = true
                    }
                    bounded.put(item)
                }
            }
            // Migrate legacy history entries on read so old token-bearing URLs
            // are not left on disk after the privacy fix.
            if (key == "history" && historyNeedsRedaction && key !in corruptRecordKeys) {
                preferences.edit().putString("history", bounded.toString()).apply()
            }
            bounded
        } catch (_: Exception) {
            // Preserve unreadable local data instead of silently replacing it.
            corruptRecordKeys.add(key)
            org.json.JSONArray()
        }
    }

    private fun showCorruptRecordsWarning(key: String) {
        AlertDialog.Builder(this)
            .setTitle("Saved data needs recovery")
            .setMessage("The saved $key data could not be read. WoHo Browser has preserved the original data and will not overwrite it automatically. Export a raw backup before clearing the damaged store.")
            .setNeutralButton("Export raw backup") { _, _ -> exportCorruptRecords(key) }
            .setNegativeButton("Clear damaged data") { _, _ -> confirmClearCorruptRecords(key) }
            .setPositiveButton("OK", null)
            .show()
    }

    private fun confirmClearCorruptRecords(key: String) {
        if (LocalRecordsPolicy.recoveryBackupFileName(key) == null || key !in corruptRecordKeys) return
        AlertDialog.Builder(this)
            .setTitle("Delete unreadable saved data?")
            .setMessage("This removes only the damaged $key store from this device. Export a raw backup first if you may need it. This action cannot be undone.")
            .setNegativeButton("Cancel", null)
            .setPositiveButton("Delete data") { _, _ ->
                preferences.edit().remove(key).apply()
                corruptRecordKeys.remove(key)
                if (key == "bookmarks") updateActiveBookmarkButton()
                Toast.makeText(this, "Damaged $key data cleared from this device.", Toast.LENGTH_LONG).show()
            }
            .show()
    }

    private fun exportCorruptRecords(key: String) {
        val filename = LocalRecordsPolicy.recoveryBackupFileName(key) ?: return
        if (key !in corruptRecordKeys) return
        val storedValue = try {
            preferences.all[key]
        } catch (_: Exception) {
            null
        }
        val backupContent = LocalRecordsPolicy.recoveryBackupContent(key, storedValue)
        if (backupContent == null) {
            Toast.makeText(this, "The original saved data could not be represented in a recovery backup.", Toast.LENGTH_LONG).show()
            return
        }
        val rawText = storedValue is String
        try {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                exportCorruptRecordsToDownloads(key, filename, backupContent, rawText)
            } else {
                shareCorruptRecordsBackup(filename, backupContent, rawText)
            }
        } catch (_: Exception) {
            Toast.makeText(this, "Could not create the recovery backup. Original saved data was not changed.", Toast.LENGTH_LONG).show()
        }
    }

    private fun exportCorruptRecordsToDownloads(key: String, filename: String, content: ByteArray, rawText: Boolean) {
        val values = android.content.ContentValues().apply {
            put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, filename)
            put(android.provider.MediaStore.MediaColumns.MIME_TYPE, "application/json")
            put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH, "${android.os.Environment.DIRECTORY_DOWNLOADS}/WoHo Browser")
            put(android.provider.MediaStore.MediaColumns.IS_PENDING, 1)
        }
        val uri = contentResolver.insert(android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
            ?: throw IllegalStateException("Could not create a backup file in Downloads.")
        try {
            val output = contentResolver.openOutputStream(uri, "wt")
                ?: throw IllegalStateException("Could not open the recovery backup file.")
            LocalRecordsPolicy.writeBackupContent(content, output)
            val publish = android.content.ContentValues().apply {
                put(android.provider.MediaStore.MediaColumns.IS_PENDING, 0)
            }
            if (contentResolver.update(uri, publish, null, null) <= 0) {
                throw IllegalStateException("Could not publish the recovery backup file.")
            }
            Toast.makeText(this, (if (rawText) "Raw " else "Typed recovery ") + "$key backup saved in Downloads/WoHo Browser. Original saved data was not changed.", Toast.LENGTH_LONG).show()
        } catch (error: Exception) {
            runCatching { contentResolver.delete(uri, null, null) }
            throw error
        }
    }

    private fun shareCorruptRecordsBackup(filename: String, content: ByteArray, rawText: Boolean) {
        val file = java.io.File(cacheDir, "recovery/$filename")
        file.parentFile?.mkdirs()
        LocalRecordsPolicy.writeBackupContent(content, file.outputStream())
        val uri = androidx.core.content.FileProvider.getUriForFile(this, "$packageName.fileprovider", file)
        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            type = "application/json"
            putExtra(Intent.EXTRA_STREAM, uri)
            clipData = android.content.ClipData.newUri(contentResolver, filename, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        startActivity(Intent.createChooser(shareIntent, "Save recovery backup"))
        val backupKind = if (rawText) "Raw backup" else "Typed recovery backup"
        Toast.makeText(this, "$backupKind may contain browsing data. Choose a trusted app to save or share it.", Toast.LENGTH_LONG).show()
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
            val guessed = BrowserUrlPolicy.sanitizeDownloadFilename(android.webkit.URLUtil.guessFileName(url, contentDisposition, mimeType))
            val host = try { URI(url).host ?: "website" } catch (_: Exception) { "website" }
            AlertDialog.Builder(this)
                .setTitle("Download file?")
                .setMessage("Save \"$guessed\" from $host to your Downloads folder?")
                .setPositiveButton("Download") { _, _ ->
                    enqueueDownload(url, userAgent, guessed, host)
                }
                .setNegativeButton("Cancel", null)
                .show()
        } catch (_: Exception) { Toast.makeText(this, "Could not start this download.", Toast.LENGTH_LONG).show() }
    }

    private fun enqueueDownload(url: String, userAgent: String, filename: String, host: String) {
        try {
            val request = DownloadManager.Request(Uri.parse(url)).apply {
                setTitle(filename)
                setDescription("Download from $host")
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                setAllowedOverMetered(true)
                setAllowedOverRoaming(false)
                addRequestHeader("User-Agent", userAgent.replace(Regex("[\\r\\n]"), "").take(512))
                setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename)
            }
            (getSystemService(DOWNLOAD_SERVICE) as DownloadManager).enqueue(request)
            Toast.makeText(this, "Download started: $filename", Toast.LENGTH_SHORT).show()
        } catch (_: Exception) {
            Toast.makeText(this, "Could not enqueue download.", Toast.LENGTH_LONG).show()
        }
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
