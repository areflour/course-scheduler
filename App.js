import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import defaultCsv from "./eckerd_cs_courses_parsed.csv";
import "./App.css";

export default function CourseSchedulerApp() {
  const [data, setData] = useState([]);
  const [rows, setRows] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [instructors, setInstructors] = useState([]);

  useEffect(() => {
    // Load course CSV
    fetch(defaultCsv)
      .then((res) => res.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            const filtered = results.data
              .map(({ "Course Code": course_number, "Course Title": course_name }) => ({ course_number, course_name }))
              .filter(d => d.course_number && d.course_name);
            setData(filtered);
          },
        });
      });

    // Load time slots
    fetch(process.env.PUBLIC_URL + "/timeSlots.txt")
      .then((res) => res.text())
      .then((text) => {
        const slots = text.split("\n").map(s => s.trim()).filter(Boolean);
        setTimeSlots(slots);
      });

    // Load instructors
    fetch(process.env.PUBLIC_URL + "/instructors.txt")
      .then((res) => res.text())
      .then((text) => {
        const instructorsList = text.split("\n").map(s => s.trim()).filter(Boolean);
        setInstructors(instructorsList);
      });
  }, []);

  const handleAddRow = () => {
    setRows((prev) => [...prev, { courseNumber: "", timeSlot: "", instructor: "" }]);
  };

  const handleChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;
    setRows(updatedRows);
  };

  const getCourseName = (courseNumber) => {
    const match = data.find((d) => d.course_number === courseNumber);
    return match ? match.course_name : "";
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(rows);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setRows(reordered);
  };

  const courseNumbers = [...new Set(data.map((d) => d.course_number))];

  return (
    <div className="scheduler-container">
      <h1>Course Scheduler</h1>

      <button className="add-button" onClick={handleAddRow}>
        Add Row
      </button>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="rows">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {rows.map((row, index) => (
                <Draggable key={index} draggableId={`row-${index}`} index={index}>
                  {(provided) => (
                    <div
                      className="row"
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <select
                        value={row.courseNumber}
                        onChange={(e) => handleChange(index, "courseNumber", e.target.value)}
                      >
                        <option value="">Select Course</option>
                        {courseNumbers.map((num) => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                      <input
                        value={getCourseName(row.courseNumber)}
                        readOnly
                      />
                      <select
                        value={row.timeSlot}
                        onChange={(e) => handleChange(index, "timeSlot", e.target.value)}
                      >
                        <option value="">Select Time</option>
                        {timeSlots.map((slot) => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                      <select
                        value={row.instructor}
                        onChange={(e) => handleChange(index, "instructor", e.target.value)}
                      >
                        <option value="">Select Instructor</option>
                        {instructors.map((inst) => (
                          <option key={inst} value={inst}>{inst}</option>
                        ))}
                      </select>
                      <button
                        className="remove-button"
                        onClick={() => {
                          const newRows = [...rows];
                          newRows.splice(index, 1);
                          setRows(newRows);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
