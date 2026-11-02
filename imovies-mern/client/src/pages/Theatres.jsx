import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Theatres({ city, onCity, say }) {
  const [list, setList] = useState([]);
  useEffect(() => { if (city) api('/theatres?city=' + encodeURIComponent(city.c)).then(setList).catch(e => say(e.message)); }, [city]);

  if (!city) return <div className="container"><p className="text-secondary mt-4">Select a city to see theatres. <button className="btn btn-link p-0" onClick={onCity}>Choose city</button></p></div>;
  return (
    <div className="container">
      <h2 className="sec">Theatres in {city.c}</h2>
      {list[0] && !list[0].real && <p className="text-secondary small">Sample theatre listing for this city.</p>}
      <div className="tgrid">{list.map(t => (
        <div className="tcard" key={t.name}><b>{t.name}</b><span className="text-secondary">Tickets from ₹{t.price}</span><span className="tag" style={{ alignSelf: 'flex-start', margin: 0 }}>Cancellation available</span></div>
      ))}</div>
    </div>
  );
}
