import React, { useState, useEffect } from "react";
import styles from "./RaceTrack.module.css";

type TaskType = {
  id: string;
  title: string;
  completed: boolean;
  position: number; // Position on track (0-100)
};

type RaceTrackVisualizationProps = {
  tasks?: TaskType[];
  className?: string;
};

const RaceTrackVisualization: React.FC<RaceTrackVisualizationProps> = ({
  tasks = [],
  className = "",
}) => {
  const [carPosition, setCarPosition] = useState(10);

  // Demo animation for the placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setCarPosition((prev) => {
        if (prev >= 85) return 10;
        return prev + 5;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Default placeholder tasks if none provided
  const demoTasks =
    tasks.length > 0
      ? tasks
      : [
          { id: "1", title: "Task 1", completed: true, position: 30 },
          { id: "2", title: "Task 2", completed: false, position: 55 },
          { id: "3", title: "Task 3", completed: false, position: 75 },
        ];

  return (
    <div className={`${styles.trackContainer} ${className}`}>
      <div className={styles.trackSurface}>
        <div className={styles.lanes}>
          <div className={styles.lane}></div>
          <div className={styles.lane}></div>
        </div>

        <div className={styles.centerLine}></div>

        <div className={styles.startLine}></div>
        <div className={styles.finishLine}></div>

        {/* Car that represents the current user's progress */}
        <div className={styles.car} style={{ left: `${carPosition}%` }}>
          <div className={styles.carBody}>
            <div className={styles.carWindow}></div>
          </div>
          <div className={styles.carWheels}>
            <div className={styles.wheel}></div>
            <div className={styles.wheel}></div>
          </div>
        </div>

        {/* Task checkpoint flags */}
        {demoTasks.map((task) => (
          <div
            key={task.id}
            className={`${styles.taskFlag} ${
              task.completed ? styles.completed : ""
            }`}
            style={{ left: `${task.position}%` }}
            title={task.title}
          >
            <div className={styles.flagPole}></div>
            <div className={styles.flagBanner}>
              {task.completed ? "✓" : "!"}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.trackEdges}>
        <div className={styles.edge}></div>
        <div className={styles.edge}></div>
      </div>
    </div>
  );
};

export default RaceTrackVisualization;
