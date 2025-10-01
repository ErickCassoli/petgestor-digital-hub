
import { useEffect, useState } from "react";
import { Calendar, Clock } from "lucide-react";

const ClockDateDisplay = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, []);
  
  // Format date as DD/MM/YYYY
  const formattedDate = currentTime.toLocaleDateString('pt-BR');
  
  // Format time as HH:MM:SS
  const formattedTime = currentTime.toLocaleTimeString('pt-BR');
  
  return (
    <div className="flex items-center gap-6 bg-gray-50 p-3 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 text-gray-800">
        <Calendar className="h-5 w-5 text-petblue-600" />
        <span className="font-medium">{formattedDate}</span>
      </div>
      <div className="flex items-center gap-2 text-gray-800">
        <Clock className="h-5 w-5 text-petblue-600" />
        <span className="font-medium">{formattedTime}</span>
      </div>
    </div>
  );
};

export default ClockDateDisplay;
