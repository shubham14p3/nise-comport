/* eslint-disable jsx-a11y/no-static-element-interactions */
const Options = (props) => {
    return (
        <div className="chatbotbox-options">
            <h1 className="chatbotbox-options-header">{props.title}</h1>
            <div className="chatbotbox-options-container">
                {props.options.map((option) => {
                    return (
                        <div
                            className="chatbotbox-option-item"
                            onClick={option.handler}
                            key={option.id}
                        >
                            {option.name}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Options;
