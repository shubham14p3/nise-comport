import React from 'react';
import Select from 'react-select';
import type { StylesConfig, GroupBase, MultiValue, SingleValue, ActionMeta } from 'react-select';

// Re-export react-select types for consumer convenience
export type { MultiValue, SingleValue, ActionMeta };

// Option Type Definition
export interface OptionType {
    value: string | number;
    label: string;
    isDisabled?: boolean;
    [key: string]: string | number | boolean | undefined;
}

// Simplified onChange handler type for easier usage
export type SimpleChangeHandler = (newValue: OptionType | readonly OptionType[] | null) => void;

// Custom Colors Interface
export interface CustomColors {
    primary?: string;
    tertiary?: string;
    mute?: string;
    info?: string;
    background?: string;
    primaryLight?: string;
    primaryGlow?: string;
}

// Custom Style Config Interface
export interface CustomStyleConfig {
    borderRadius?: string;
    padding?: string;
    fontSize?: string;
    optionPadding?: string;
    boxShadowIntensity?: string;
    focusGlowSize?: string;
    minHeight?: string;
}

// Component Props Interface
export interface CustomSelectProps {
    options: OptionType[];
    value?: OptionType | OptionType[] | null;
    // Support both simple and full onChange handlers
    onChange?: SimpleChangeHandler | ((newValue: MultiValue<OptionType> | SingleValue<OptionType>, actionMeta: ActionMeta<OptionType>) => void);
    placeholder?: string;
    name?: string;
    id?: string;
    isDisabled?: boolean;
    isSearchable?: boolean;
    isClearable?: boolean;
    isMulti?: boolean;
    customColors?: CustomColors;
    customStyles?: CustomStyleConfig;
    className?: string;
    defaultValue?: OptionType | OptionType[];
}

const CustomSelect: React.FC<CustomSelectProps> = ({
    options = [],
    value = null,
    onChange,
    placeholder = "Select an option",
    name = "custom-select",
    id = "custom-select",
    isDisabled = false,
    isSearchable = true,
    isClearable = false,
    isMulti = false,
    customColors = {},
    customStyles = {},
    className = "",
    defaultValue,
}) => {
    // Default color scheme - matches src/assets/css/style.css design tokens
    const defaultColors: Required<CustomColors> = {
        primary: 'var(--itzone-base)',             // #6e54f3 - Main brand color
        tertiary: 'var(--itzone-black)',           // #070d1a - Text color
        mute: 'var(--itzone-gray)',                // #666666 - Border and placeholder
        info: 'var(--itzone-white)',               // Selected text color
        background: 'var(--itzone-white)',         // Background
        primaryLight: 'rgba(var(--itzone-base-rgb), 0.1)',  // Hover background
        primaryGlow: 'rgba(var(--itzone-base-rgb), 0.2)',   // Focus glow
    };

    // Merge custom colors with defaults
    const colors = { ...defaultColors, ...customColors };

    // Default style configuration - matches form inputs in style.css / contact.css / shop.css
    const defaultStyleConfig: Required<CustomStyleConfig> = {
        borderRadius: 'var(--itzone-bdr-radius)',  // 5px
        padding: '10px 20px',
        fontSize: '16px',
        optionPadding: '12px 20px',
        boxShadowIntensity: '0 10px 25px rgba(0,0,0,0.1)',
        focusGlowSize: '2px',
        minHeight: '50px',
    };

    // Merge with custom style config
    const styleConfig = { ...defaultStyleConfig, ...customStyles };

    // Wrapper to handle both simple and full onChange signatures
    const handleChange = (
        newValue: MultiValue<OptionType> | SingleValue<OptionType>,
        actionMeta: ActionMeta<OptionType>
    ) => {
        if (!onChange) return;

        // Check if onChange expects actionMeta parameter (has 2 parameters)
        if (onChange.length === 2) {
            // Full handler with actionMeta
            (onChange as (newValue: MultiValue<OptionType> | SingleValue<OptionType>, actionMeta: ActionMeta<OptionType>) => void)(newValue, actionMeta);
        } else {
            // Simple handler - MultiValue is readonly OptionType[], SingleValue is OptionType | null
            (onChange as SimpleChangeHandler)(newValue);
        }
    };

    const selectStyles: StylesConfig<OptionType, boolean, GroupBase<OptionType>> = {
        // Main input container control - matches style.css form inputs
        control: (base, state) => ({
            ...base,
            minHeight: styleConfig.minHeight,
            borderRadius: styleConfig.borderRadius,
            padding: styleConfig.padding,
            backgroundColor: colors.background,
            border: `1px solid ${state.isFocused ? colors.primary : 'rgba(var(--itzone-black-rgb), 0.1)'}`,
            boxShadow: state.isFocused
                ? `0 0 0 ${styleConfig.focusGlowSize} ${colors.primaryGlow}`
                : 'none',
            transition: 'all 500ms ease',
            cursor: 'pointer',
            fontFamily: 'var(--itzone-font)',
            fontSize: styleConfig.fontSize,
            '&:hover': {
                borderColor: colors.primary,
            },
            ...(state.isDisabled && {
                backgroundColor: 'var(--itzone-secondary)',
                cursor: 'not-allowed',
            }),
        }),

        // The actual dropdown menu - matches style.css form styling
        menu: (base) => ({
            ...base,
            borderRadius: styleConfig.borderRadius,
            boxShadow: styleConfig.boxShadowIntensity,
            overflow: 'hidden',
            marginTop: '8px',
            backgroundColor: colors.background,
            fontFamily: 'var(--itzone-font)',
            border: '1px solid rgba(var(--itzone-black-rgb), 0.1)',
        }),

        // Menu portal for z-index issues
        menuPortal: (base) => ({
            ...base,
            zIndex: 9999
        }),

        // Individual options inside the dropdown - matches style.css
        option: (base, state) => ({
            ...base,
            padding: styleConfig.optionPadding,
            fontSize: styleConfig.fontSize,
            fontFamily: 'var(--itzone-font)',
            cursor: 'pointer',
            transition: 'all 500ms ease',
            color: state.isSelected ? colors.info : 'var(--itzone-gray)',
            backgroundColor: state.isSelected
                ? colors.primary
                : state.isFocused
                    ? colors.primaryLight
                    : 'transparent',
            '&:active': {
                backgroundColor: colors.primary,
                color: colors.info,
            },
        }),

        // Selected value text - matches style.css
        singleValue: (base) => ({
            ...base,
            color: 'var(--itzone-black)',
            fontWeight: '400',
            fontFamily: 'var(--itzone-font)',
        }),

        // Multi-select values
        multiValue: (base) => ({
            ...base,
            backgroundColor: 'rgba(var(--itzone-base-rgb), 0.1)',
            borderRadius: 'var(--itzone-bdr-radius)',
        }),

        multiValueLabel: (base) => ({
            ...base,
            color: 'var(--itzone-black)',
            fontFamily: 'var(--itzone-font)',
        }),

        multiValueRemove: (base) => ({
            ...base,
            color: colors.primary,
            ':hover': {
                backgroundColor: colors.primary,
                color: colors.info,
            },
        }),

        // Placeholder text - matches style.css
        placeholder: (base) => ({
            ...base,
            color: 'var(--itzone-gray)',
            fontFamily: 'var(--itzone-font)',
        }),

        // Input (search) - matches style.css form input
        input: (base) => ({
            ...base,
            color: 'var(--itzone-black)',
            fontFamily: 'var(--itzone-font)',
            fontSize: styleConfig.fontSize,
        }),

        // Dropdown arrow
        dropdownIndicator: (base, state) => ({
            ...base,
            color: state.isFocused ? colors.primary : colors.mute,
            transition: 'all 0.3s ease',
            '&:hover': {
                color: colors.primary,
            },
        }),

        // Remove the vertical line separator
        indicatorSeparator: () => ({
            display: 'none',
        }),

        // Loading indicator
        loadingIndicator: (base) => ({
            ...base,
            color: colors.primary,
        }),

        // Clear indicator
        clearIndicator: (base) => ({
            ...base,
            color: colors.mute,
            ':hover': {
                color: colors.primary,
            },
        }),
    };

    return (
        <Select
            id={id}
            name={name}
            inputId={id}
            options={options}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            placeholder={placeholder}
            isDisabled={isDisabled}
            isSearchable={isSearchable}
            isClearable={isClearable}
            isMulti={isMulti}
            className={className}
            classNamePrefix="custom-select"
            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            styles={selectStyles}
        />
    );
};

export default CustomSelect;