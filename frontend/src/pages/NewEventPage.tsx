import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { eventsApi } from '../api';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  type: z.enum(['WEDDING', 'CONFERENCE', 'BIRTHDAY', 'OTHER']),
  venue: z.string().optional(),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().min(1, 'End date required'),
  startTime: z.string().optional().or(z.literal('')),
  endTime: z.string().optional().or(z.literal('')),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: "End date cannot be before start date",
  path: ["endDate"]
}).refine((data) => {
  if (data.startDate === data.endDate) {
    return !!data.startTime && !!data.endTime;
  }
  return true;
}, {
  message: "Start and end times are required when event is on the same day",
  path: ["startTime"]
});

type FormData = z.infer<typeof schema>;

export default function NewEventPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'WEDDING', startDate: '', endDate: '', startTime: '', endTime: '' },
  });

  const startDateVal = watch('startDate');
  const endDateVal = watch('endDate');
  const showTimeFields = startDateVal && endDateVal && startDateVal === endDateVal;

  const onSubmit = async (data: FormData) => {
    const isSameDay = data.startDate === data.endDate;
    const res = await eventsApi.create({
      name: data.name,
      type: data.type,
      venue: data.venue,
      eventDate: data.startDate, // legacy eventDate compatibility
      startDate: data.startDate,
      endDate: data.endDate,
      startTime: (isSameDay && data.startTime) ? `${data.startTime}:00` : undefined,
      endTime: (isSameDay && data.endTime) ? `${data.endTime}:00` : undefined,
    });
    navigate(`/events/${res.data.id}`);
  };

  return (
    <div className="p-4 sm:p-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-6 text-[#0c0f14]">Create Event</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-[#0c0f14]">Event Name</label>
          <input {...register('name')} className="w-full px-3 py-2 border rounded-lg text-sm text-[#0c0f14]" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-[#0c0f14]">Type</label>
          <select {...register('type')} className="w-full px-3 py-2 border rounded-lg text-sm text-[#0c0f14]">
            <option value="WEDDING">Wedding</option>
            <option value="CONFERENCE">Conference</option>
            <option value="BIRTHDAY">Birthday</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-[#0c0f14]">Venue</label>
          <input {...register('venue')} className="w-full px-3 py-2 border rounded-lg text-sm text-[#0c0f14]" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-[#0c0f14]">Start Date</label>
            <input {...register('startDate')} type="date" className="w-full px-3 py-2 border rounded-lg text-sm text-[#0c0f14]" />
            {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[#0c0f14]">End Date</label>
            <input {...register('endDate')} type="date" className="w-full px-3 py-2 border rounded-lg text-sm text-[#0c0f14]" />
            {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate.message}</p>}
          </div>
        </div>

        {showTimeFields && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-sm font-medium mb-1 text-[#0c0f14]">Start Time</label>
              <input {...register('startTime')} type="time" className="w-full px-3 py-2 border rounded-lg text-sm text-[#0c0f14]" />
              {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[#0c0f14]">End Time</label>
              <input {...register('endTime')} type="time" className="w-full px-3 py-2 border rounded-lg text-sm text-[#0c0f14]" />
              {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime.message}</p>}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Creating Event...' : 'Create Event'}
        </button>
      </form>
    </div>
  );
}
