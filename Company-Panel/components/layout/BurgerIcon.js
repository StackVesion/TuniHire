
export default function BurgerIcon({ handleToggle, isToggled }) {
    return (
        <>
            <div className={`burger-icon burger-icon-white ${isToggled ? "burger-close" : ""}`}
                onClick={() => { handleToggle(); }}>
                <span className="burger-icon-top" />
                <span className="burger-icon-mid" />
                <span className="burger-icon-bottom" />
            </div>
        </>
    )
}
