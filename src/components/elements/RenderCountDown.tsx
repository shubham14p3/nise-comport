interface RenderCount {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    completed: boolean;
}

const RenderCountDown = ({
    days,
    hours,
    minutes,
    seconds,
    completed,
}: RenderCount) => {
    if (completed) {
        return <span>Time’s up!</span>;
    } else {
        return (
            <div className="countdown-container">
                <div className="countdown-item">
                    <h2>{days}</h2>
                    <span>DAYS</span>
                </div>
                <div className="countdown-item">
                    <h2>{hours}</h2>
                    <span>HRS</span>
                </div>
                <div className="countdown-item">
                    <h2>{minutes}</h2>
                    <span>MINS</span>
                </div>
                <div className="countdown-item">
                    <h2>{seconds}</h2>
                    <span>SECS</span>
                </div>
            </div>
        );
    }
};
export default RenderCountDown;
