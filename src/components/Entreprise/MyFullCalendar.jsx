import React, { useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import './Calendar.css';

const EventCalendar = () => {
  const calendarRef = useRef(null);
  const [events, setEvents] = useState([
    { 
      id: '1',
      title: 'Réunion équipe', 
      start: '2025-08-12T10:00:00',
      end: '2025-08-12T11:30:00',
      backgroundColor: '#44745c',
      borderColor: '#315442',
      textColor: '#ffffff'
    },
    { 
      id: '2',
      title: 'Présentation client', 
      start: '2025-08-15T14:00:00',
      end: '2025-08-15T16:00:00',
      backgroundColor: '#569375',
      borderColor: '#315442',
      textColor: '#ffffff'
    },
    { 
      id: '3',
      title: 'Revue de projet', 
      start: '2025-08-20T09:00:00',
      end: '2025-08-20T12:00:00',
      backgroundColor: '#72ac8f',
      borderColor: '#44745c',
      textColor: '#ffffff'
    }
  ]);

  const handleDateClick = (arg) => {
    const title = prompt("Titre de l'événement :");
    if (title) {
      const newEvent = {
        id: Date.now().toString(),
        title,
        start: arg.dateStr,
        backgroundColor: '#92bfa8',
        borderColor: '#569375',
        textColor: '#ffffff'
      };
      setEvents([...events, newEvent]);
    }
  };

  const handleEventClick = (clickInfo) => {
    if (window.confirm(`Supprimer "${clickInfo.event.title}" ?`)) {
      setEvents(events.filter(event => event.id !== clickInfo.event.id));
    }
  };

  const handleEventDrop = (eventInfo) => {
    const updatedEvents = events.map(event => 
      event.id === eventInfo.event.id ? 
      { ...event, start: eventInfo.event.start, end: eventInfo.event.end } : 
      event
    );
    setEvents(updatedEvents);
  };

  return (
    <div className="calendar-app">
      <div className="calendar-header">
        <h1>Calendrier des Événements</h1>
        <div className="calendar-controls">
          <button 
            className="today-button"
            onClick={() => {
              const calendarApi = calendarRef.current.getApi();
              calendarApi.today();
            }}
          >
            Aujourd'hui
          </button>
        </div>
      </div>
      
      <div className="calendar-container">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locales={[frLocale]}
          locale="fr"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          buttonText={{
            today: 'Aujourd\'hui',
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour'
          }}
          firstDay={1} // Lundi comme premier jour
          weekends={true}
          events={events}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventDrop}
          height="auto"
          nowIndicator={true}
          navLinks={true}
          dayHeaderFormat={{ weekday: 'short' }}
          titleFormat={{ year: 'numeric', month: 'long' }}
        />
      </div>
    </div>
  );
};

export default EventCalendar;