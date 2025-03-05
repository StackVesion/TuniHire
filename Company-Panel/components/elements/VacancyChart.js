import {
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend
);

const options = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top',
            display: false,
        },
    },

    scales: {
        x: {
            barPercentage: 0.5,
            grid: {
                display: true,
                drawBorder: true,
            },
        },

        y:
        {
            grid: {
                display: true,
                drawBorder: true,
            },
            ticks: {
                stepSize: 50,
            },
        },

    },

};

const data = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
        {
            fill: true,
            label: "My First dataset",
            data: [30, 60, 90, 120, 150, 180, 200],
            borderColor: "#2082FB",
            borderWidth: "2",
            backgroundColor: "rgba(179, 184, 237, 0.8)",
            pointBackgroundColor: "#2082FB",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#2082FB",
            pointHoverBorderColor: "#2082FB",
            pointRadius: 6,
            pointHoverRadius: 6,
        },
        {
            fill: true,
            label: "My First dataset",
            data: [40, 80, 120, 160, 200, 240],
            borderColor: "#DAE2F3",
            borderWidth: "2",
            backgroundColor: "rgba(179, 201, 237, 0.8)",
            pointBackgroundColor: "#DAE2F3",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#DAE2F3",
            pointHoverBorderColor: "#DAE2F3",
            pointRadius: 6,
            pointHoverRadius: 6,
        },
        {
            fill: true,
            label: "My First dataset",
            data: [20, 70, 120, 170, 220, 250],
            borderColor: "#DAE2F3",
            borderWidth: "2",
            backgroundColor: "rgba(179, 219, 237, 0.8)",
            pointBackgroundColor: "#DAE2F3",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#DAE2F3",
            pointHoverBorderColor: "#DAE2F3",
            pointRadius: 6,
            pointHoverRadius: 6,
        },
    ],
};

export default function VacancyChart() {
    return (
        <>
            <Line options={options} data={data} />
        </>
    );
}
