export default function Offers({ config }) {
  return (
    <div className="container">
      <h2 className="sec">Offers for you</h2>
      <div className="tgrid">{Object.entries(config.coupons).map(([code, c]) => (
        <div className="tcard" key={code}><b>{code}</b><span className="text-secondary">{c.desc}. Enter it on the seat selection screen.</span></div>
      ))}</div>
    </div>
  );
}
