interface Props {
  value: number;
  setValue: (value: number) => void;
}

const Range = ({ value, setValue }: Props) => {
  const handleClick = (i: number) => {
    setValue(value === i + 1 ? i : i + 1);
  };

  return (
    <div className="stat-bar-container">
      <div className="stat-bar">
        {Array.from({ length: 10 }, (_, i) => (
          <button
            key={i}
            className={`stat-segment ${i < value ? 'filled' : ''}`}
            onClick={() => handleClick(i)}
            aria-label={`Rate ${i + 1}`}
          />
        ))}
      </div>
      <span className="stat-value">{value}</span>
    </div>
  );
};

export default Range;
