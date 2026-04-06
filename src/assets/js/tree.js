jQuery(document).ready(function () {

    $(".full-height").css("height", $(window).height());
    const getSvgIcon = (svgString) => "data:image/svg+xml;base64," + btoa(svgString);

    const folderClosedIcon = getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#FFA500"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>');

    const folderOpenIcon = getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#FFA500"><path d="M19 20H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2h6l2 2h7a2 2 0 0 1 2 2H4v10l2.14-8h17.07l-2.28 8.5c-.23.87-1.01 1.5-1.93 1.5z"/></svg>');
    $("#dz_tree").jstree({
        "core": {
            "data": typeof treeData !== 'undefined' ? treeData : [],
            themes: {
                responsive: false,
                variant: "large",
                dots: true,
                icons: true,
                ellipsis: true,
                stripes: false
            }
        },
        "types": {
            "default": { "icon": "fa fa-file" },
            "folder": { "icon": folderClosedIcon },

            // TypeScript & JavaScript
            "tsx": {
                "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="8" ry="3" fill="none" stroke="#61DAFB" stroke-width="1.8"/><ellipse cx="12" cy="12" rx="8" ry="3" fill="none" stroke="#61DAFB" stroke-width="1.8" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="8" ry="3" fill="none" stroke="#61DAFB" stroke-width="1.8" transform="rotate(120 12 12)"/><circle cx="12" cy="12" r="1.5" fill="#61DAFB"/></svg>')
            },
            "ts": {
                "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" fill="#3178C6"/><text x="12" y="16.5" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#FFF" text-anchor="middle">TS</text></svg>')
            },
            "js": {
                "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" fill="#F7DF1E"/><text x="12" y="16.5" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#000" text-anchor="middle">JS</text></svg>')
            },

            // Styles
            "css": {
                "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M5 3l1.5 16.5L12 21l5.5-1.5L19 3z" fill="#2965f1"/><path d="M12 4.5v15l4-1.1L17.3 4.5z" fill="#264de4"/><path d="M8.5 9h7l-.3 3.5h-4.7l.2 2h4.3l-.3 2.5-2.7.8-2.7-.8-.2-1.5H7.2l.3 3 5 1.5 5-1.5.7-7.5L18.5 7h-11z" fill="#ebebeb"/><path d="M12 9v2h3.5l-.3 3.5H12v2l2.7-.8.2-2.2H12v-2h3.2l.3-2.5z" fill="#ffffff00"/></svg>')
            },
            "scss": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#CC6699" opacity=".15"/><path d="M8 13h8m-8 3h6m-6 3h4" fill="none" stroke="#CC6699" stroke-width="2" stroke-linecap="round"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="#CC6699" stroke-width="2"/></svg>') },
            "sass": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#CC6699" opacity=".15"/><path d="M8 13h8m-8 3h6m-6 3h4" fill="none" stroke="#CC6699" stroke-width="2" stroke-linecap="round"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="#CC6699" stroke-width="2"/></svg>') },

            // Markup
            "html": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#E34F26" opacity=".1"/><path d="M9 17l-2-2 2-2m6 0l2 2-2 2" fill="none" stroke="#E34F26" stroke-width="2" stroke-linecap="round"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="#E34F26" stroke-width="2"/></svg>') },
            "xml": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#FF6600" opacity=".1"/><path d="M9 17l-2-2 2-2m6 0l2 2-2 2m-3-6l-2 8" fill="none" stroke="#FF6600" stroke-width="2" stroke-linecap="round"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="#FF6600" stroke-width="2"/></svg>') },
            "md": {
                "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><text x="4" y="16" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#0366d6">M</text><path d="M17 9v7m0-7l2 2m-2-2l-2 2" fill="none" stroke="#0366d6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>')
            },

            // Data
            "json": {
                "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M9 5c-1.5 0-2 1-2 2.5v3c0 1-.5 1.5-1.5 1.5M9 19c-1.5 0-2-1-2-2.5v-3c0-1-.5-1.5-1.5-1.5" fill="none" stroke="#b2a602" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 5c1.5 0 2 1 2 2.5v3c0 1 .5 1.5 1.5 1.5M15 19c1.5 0 2-1 2-2.5v-3c0-1 .5-1.5 1.5-1.5" fill="none" stroke="#b2a602" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>')
            },
            "yaml": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#CB171E" opacity=".1"/><path d="M8 13h8M8 16h6" fill="none" stroke="#CB171E" stroke-width="2" stroke-linecap="round"/><circle cx="7" cy="13" r="0.5" fill="#CB171E"/><circle cx="7" cy="16" r="0.5" fill="#CB171E"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="#CB171E" stroke-width="2"/></svg>') },
            "yml": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#CB171E" opacity=".1"/><path d="M8 13h8M8 16h6" fill="none" stroke="#CB171E" stroke-width="2" stroke-linecap="round"/><circle cx="7" cy="13" r="0.5" fill="#CB171E"/><circle cx="7" cy="16" r="0.5" fill="#CB171E"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="#CB171E" stroke-width="2"/></svg>') },

            // Python
            "py": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#3776AB" opacity=".15"/><path d="M9 14c0-1.5 1-2 2-2h2c1 0 2 .5 2 2v2c0 1.5-1 2-2 2h-2c-1 0-2-.5-2-2z" fill="none" stroke="#3776AB" stroke-width="2"/><circle cx="10" cy="15" r="0.5" fill="#3776AB"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="#3776AB" stroke-width="2"/></svg>') },

            // Java & Related
            "java": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#007396" opacity=".15"/><path d="M11 18c-2 0-3-1-3-2m3 0c2 0 3-1 3-2M11 13v5" fill="none" stroke="#007396" stroke-width="2" stroke-linecap="round"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="#007396" stroke-width="2"/></svg>') },

            // C/C++
            "c": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#00599C" opacity=".15"/><path d="M13 13c-1.5 0-2 1-2 2s.5 2 2 2" fill="none" stroke="#00599C" stroke-width="2" stroke-linecap="round"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="#00599C" stroke-width="2"/></svg>') },
            "cpp": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#00599C" opacity=".15"/><path d="M11 13c-1 0-1.5.5-1.5 1.5s.5 1.5 1.5 1.5m2.5-1h2m.5-1v2" fill="none" stroke="#00599C" stroke-width="2" stroke-linecap="round"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="#00599C" stroke-width="2"/></svg>') },

            // Go
            "go": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#00ADD8" opacity=".15"/><path d="M9 15h6M8 13h8" fill="none" stroke="#00ADD8" stroke-width="2" stroke-linecap="round"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="#00ADD8" stroke-width="2"/></svg>') },

            // Rust
            "rs": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#CE422B" opacity=".15"/><circle cx="12" cy="15" r="3" fill="none" stroke="#CE422B" stroke-width="2"/><circle cx="12" cy="15" r="1" fill="#CE422B"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="#CE422B" stroke-width="2"/></svg>') },

            // PHP
            "php": {
                "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10" ry="5.5" fill="none" stroke="#777BB4" stroke-width="2.5"/><text x="12" y="14.5" font-family="Arial, sans-serif" font-size="7" font-weight="bold" fill="#777BB4" text-anchor="middle">PHP</text></svg>')
            },
            "blade": {
                "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 50 52"><path d="M49.626 11.564a.809.809 0 0 1 .028.209v10.972a.8.8 0 0 1-.402.694l-9.209 5.302V39.25c0 .286-.152.55-.4.694L20.42 51.01c-.044.025-.092.041-.14.058-.018.006-.035.017-.054.022a.805.805 0 0 1-.41 0c-.022-.006-.042-.018-.063-.026-.044-.016-.09-.03-.132-.054L.402 39.944A.801.801 0 0 1 0 39.25V6.334c0-.072.01-.142.028-.21.006-.023.02-.044.028-.067.015-.042.029-.085.051-.124.015-.026.037-.047.055-.071.023-.032.044-.065.071-.093.023-.023.053-.04.079-.06.029-.024.055-.05.088-.069h.001l9.61-5.533a.802.802 0 0 1 .8 0l9.61 5.533h.002c.032.02.059.045.088.068.026.02.055.038.078.06.028.029.048.062.072.094.017.024.04.045.054.071.023.04.036.082.052.124.008.023.022.044.028.068a.809.809 0 0 1 .028.209v20.559l8.008-4.611v-10.51c0-.07.01-.141.028-.208.007-.024.02-.045.028-.068.016-.042.03-.085.052-.124.015-.026.037-.047.054-.071.024-.032.044-.065.072-.093.023-.023.052-.04.078-.06.03-.024.056-.05.088-.069h.001l9.611-5.533a.801.801 0 0 1 .8 0l9.61 5.533c.034.02.06.045.09.068.025.02.054.038.077.06.028.029.048.062.072.094.018.024.04.045.054.071.023.039.036.082.052.124.009.023.022.044.028.068zm-1.574 10.718v-9.124l-3.363 1.936-4.646 2.675v9.124l8.01-4.611zm-9.61 16.505v-9.13l-4.57 2.61-13.05 7.448v9.216l17.62-10.144zM1.602 7.719v31.068L19.22 48.93v-9.214l-9.204-5.209-.003-.002-.004-.002c-.031-.018-.057-.044-.086-.066-.025-.02-.054-.036-.076-.058l-.002-.003c-.026-.025-.044-.056-.066-.084-.02-.027-.044-.05-.06-.078l-.001-.003c-.018-.03-.029-.066-.042-.1-.013-.03-.03-.058-.038-.09v-.001c-.01-.038-.012-.078-.016-.117-.004-.03-.012-.06-.012-.09v-.002-21.481L4.965 9.654 1.602 7.72zm8.81-5.994L2.405 6.334l8.005 4.609 8.006-4.61-8.006-4.608zm4.164 28.764l4.645-2.674V7.719l-3.363 1.936-4.646 2.675v20.096l3.364-1.937zM39.243 7.164l-8.006 4.609 8.006 4.609 8.005-4.61-8.005-4.608zm-.801 10.605l-4.646-2.675-3.363-1.936v9.124l4.645 2.674 3.364 1.937v-9.124zM20.02 38.33l11.743-6.704 5.87-3.35-8-4.606-9.211 5.303-8.395 4.833 7.993 4.524z" fill="#FF2D20" fill-rule="evenodd"/></svg>')
            },

            // Ruby
            "rb": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#CC342D" opacity=".15"/><path d="M9 13l3 3 3-3-3-3z" fill="none" stroke="#CC342D" stroke-width="2" stroke-linejoin="round"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="#CC342D" stroke-width="2"/></svg>') },

            // Images
            "png": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#9C27B0" opacity=".1"/><rect x="8" y="12" width="8" height="6" rx="1" fill="none" stroke="#9C27B0" stroke-width="2"/><circle cx="10" cy="14" r="1" fill="#9C27B0"/><path d="M16 18l-2-2-2 2-2-2" fill="none" stroke="#9C27B0" stroke-width="2" stroke-linecap="round"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="#9C27B0" stroke-width="2"/></svg>') },
            "jpg": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#E91E63" opacity=".1"/><rect x="8" y="12" width="8" height="6" rx="1" fill="none" stroke="#E91E63" stroke-width="2"/><circle cx="10" cy="14" r="1" fill="#E91E63"/><path d="M16 18l-2-2-2 2-2-2" fill="none" stroke="#E91E63" stroke-width="2" stroke-linecap="round"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="#E91E63" stroke-width="2"/></svg>') },
            "jpeg": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#E91E63" opacity=".1"/><rect x="8" y="12" width="8" height="6" rx="1" fill="none" stroke="#E91E63" stroke-width="2"/><circle cx="10" cy="14" r="1" fill="#E91E63"/><path d="M16 18l-2-2-2 2-2-2" fill="none" stroke="#E91E63" stroke-width="2" stroke-linecap="round"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="#E91E63" stroke-width="2"/></svg>') },
            "svg": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#FFB13B" opacity=".15"/><path d="M9 15l2-3 2 3 2-4" fill="none" stroke="#FFB13B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="#FFB13B" stroke-width="2"/></svg>') },
            "gif": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#00BCD4" opacity=".1"/><rect x="8" y="12" width="8" height="6" rx="1" fill="none" stroke="#00BCD4" stroke-width="2"/><circle cx="10" cy="14" r="1" fill="#00BCD4"/><path d="M16 18l-2-2-2 2-2-2" fill="none" stroke="#00BCD4" stroke-width="2" stroke-linecap="round"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="#00BCD4" stroke-width="2"/></svg>') },

            // Documents
            "pdf": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#F40F02" opacity=".1"/><path d="M8 13h8M8 16h6" fill="none" stroke="#F40F02" stroke-width="2" stroke-linecap="round"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="#F40F02" stroke-width="2"/></svg>') },
            "doc": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#2B579A" opacity=".15"/><path d="M8 13h8M8 16h6M8 19h4" fill="none" stroke="#2B579A" stroke-width="2" stroke-linecap="round"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="#2B579A" stroke-width="2"/></svg>') },
            "docx": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#2B579A" opacity=".15"/><path d="M8 13h8M8 16h6M8 19h4" fill="none" stroke="#2B579A" stroke-width="2" stroke-linecap="round"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="#2B579A" stroke-width="2"/></svg>') },
            "txt": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#666" opacity=".1"/><path d="M8 13h8M8 16h6M8 19h4" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="#666" stroke-width="2"/></svg>') },

            // Archives
            "zip": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#F9A825" opacity=".15"/><path d="M11 8v8m0-8h2m-2 2h2m-2 2h2m-2 2h2m-2 2h2" fill="none" stroke="#F9A825" stroke-width="2" stroke-linecap="round"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="#F9A825" stroke-width="2"/></svg>') },
            "rar": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#F9A825" opacity=".15"/><path d="M11 8v8m0-8h2m-2 2h2m-2 2h2m-2 2h2m-2 2h2" fill="none" stroke="#F9A825" stroke-width="2" stroke-linecap="round"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="#F9A825" stroke-width="2"/></svg>') },

            // Video/Audio
            "mp4": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#FF5722" opacity=".15"/><path d="M10 13l4 2-4 2z" fill="#FF5722"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="#FF5722" stroke-width="2"/></svg>') },
            "mp3": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#FF9800" opacity=".15"/><path d="M9 13v4m3-5v6m3-4v2" fill="none" stroke="#FF9800" stroke-width="2" stroke-linecap="round"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="#FF9800" stroke-width="2"/></svg>') },

            // Config files
            "env": {
                "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><rect x="4" y="4" width="19" height="19" rx="2" fill="#ECD53F"/><text x="12" y="16.5" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#000" text-anchor="middle">ENV</text></svg>')
            },
            "git": {
                "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><circle cx="8" cy="8" r="2" fill="none" stroke="#F05032" stroke-width="2.5"/><circle cx="16" cy="12" r="2" fill="none" stroke="#F05032" stroke-width="2.5"/><circle cx="12" cy="18" r="2" fill="none" stroke="#F05032" stroke-width="2.5"/><path d="M9.5 9.5L14.5 11M14 13.5L13 16.5" fill="none" stroke="#F05032" stroke-width="2.5" stroke-linecap="round"/></svg>')
            },

            // Generic
            "file": { "icon": getSvgIcon('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>') }
        },
        "plugins": ["types"]
    })
        .on('ready.jstree', function () {
            var tree = $(this).jstree(true);
            tree.get_json('#', { flat: true }).forEach(function (node) {
                if (node.type === 'folder' && tree.is_open(node.id)) {
                    tree.set_icon(node.id, folderOpenIcon);
                }
            });
        })
        .on('open_node.jstree', function (e, data) {
            if (data.node.type === 'folder') {
                $(this).jstree(true).set_icon(data.node, folderOpenIcon);
            }
        })
        .on('close_node.jstree', function (e, data) {
            if (data.node.type === 'folder') {
                $(this).jstree(true).set_icon(data.node, folderClosedIcon);
            }
        });
});