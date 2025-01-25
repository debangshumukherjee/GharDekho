import { Link } from "react-router-dom";
import "./card.scss";

function Card({ item }) {
  return (
    <Link to={`/${item.id}`} className="card">
      <div className={`status ${item.status ? "unavil" : ""}`}>
        {item.status && (
          <img src="/unavailable.png" alt="Unavailable" className="stamp" />
        )}
      </div>
      <Link to={`/${item.id}`} className="imageContainer">
        <img
          src={item.images[0] ? item.images[0] : "/Image_not_available.png"}
          alt=""
        />
      </Link>
      <div className="textContainer">
        <h2 className="title">
          <Link to={`/${item.id}`}>{item.title}</Link>
        </h2>
        <p className="address">
          <img src="/pin.png" alt="" />
          <span>{item.address}</span>
        </p>
        <p className="price">Rs. {item.price}</p>
        <div className="bottom">
          <div className="features">
            <div className="feature">
              <img src="/bed.png" alt="" />
              <span>{item.bedroom} bedroom</span>
            </div>
            <div className="feature">
              <img src="/bath.png" alt="" />
              <span>{item.bathroom} bathroom</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default Card;
