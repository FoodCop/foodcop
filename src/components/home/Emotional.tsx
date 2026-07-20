import React from 'react';

export default function Emotional() {
  return (
    <section id="emotional">
      <div className="emo-bg">
        <img src="/v6/emotional.png" alt="Food memories and moments" />
      </div>
      <div className="emo-content">
        <h2 className="emo-h sr">Food Is More<br />Than A Meal.</h2>
        <div className="emo-lines" id="eLines">
          <span>It&apos;s birthdays.</span>
          <span>Road trips.</span>
          <span>Weekend brunches.</span>
          <span>Late-night cravings.</span>
          <span>Family dinners.</span>
        </div>
        <p className="emo-end sr d5">Every meal has a story.<br />FUZO helps you discover yours.</p>
      </div>
    </section>
  );
}
