import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginImport from "eslint-plugin-import";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import pluginPrettier from "eslint-plugin-prettier";

/** @type {import('eslint').Linter.Config} */
export default [
    {
        files: ["**/*.{js,mjs,cjs,jsx}"],
        ignores: ["node_modules", "build", "dist"], // Replaces .eslintignore
        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
                ecmaVersion: 12,
                sourceType: "module",
            },
        },
        plugins: {
            react: pluginReact,
            "react-hooks": pluginReactHooks, // Add react-hooks plugin here
            import: pluginImport,
            "jsx-a11y": pluginJsxA11y,
            prettier: pluginPrettier,
        },
        settings: {
            react: {
                version: "detect", // Automatically detect React version
            },
        },
        rules: {
            ...pluginJs.configs.recommended.rules,
            ...pluginReact.configs.recommended.rules,
            ...pluginJsxA11y.configs.strict.rules,
            "prettier/prettier": "error",
            "react/react-in-jsx-scope": "off",
            "react/require-default-props": "off",
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",
            "react/prop-types": "off",
            "react/display-name": "off",
            "jsx-a11y/click-events-have-key-events": "off",
            "jsx-a11y/no-static-element-interactions": "off",
            "jsx-a11y/label-has-associated-control": [
                "error",
                {
                    required: {
                        some: ["nesting", "id"],
                    },
                },
            ],
            "jsx-a11y/label-has-for": [
                "error",
                {
                    required: {
                        some: ["nesting", "id"],
                    },
                },
            ],
        },
    },
];
