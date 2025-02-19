"use client"
import Slider from "react-slick";
import React, { Component } from "react";
import Image from "next/image";

// CAROUSEL DATA

interface JobDataType {
    title: string;
    company: string;
    location: string;
    imgSrc: string;
}

const jobData: JobDataType[] = [
    {
        title: 'Senior UX Designer',
        company: 'Angular developer',
        location: 'New York, NY',
        imgSrc: '/assets/jobs/job1.png',
    },
    {
        title: 'Frontend Developer',
        company: 'Innovatech',
        location: 'San Francisco, CA',
        imgSrc: '/assets/jobs/job2.png',
    },
    {
        title: 'Backend Developer',
        company: 'Dev Solutions',
        location: 'Austin, TX',
        imgSrc: '/assets/jobs/job3.png',
    },
]

// CAROUSEL SETTINGS

function SampleNextArrow(props: { className: any; style: any; onClick: any; }) {
    const { className, style, onClick } = props;
    return (
        <div
            className={className}
            style={{ ...style, display: "flex", justifyContent: "center", position: 'absolute', alignItems: "center" , background: "#D5EFFA", padding: "28px", borderRadius: "30px", border: "1px solid #1A21BC" }}
            onClick={onClick}
        />
    );
}

function SamplePrevArrow(props: { className: any; style: any; onClick: any; }) {
    const { className, style, onClick } = props;
    return (
        <div
            className={className}
            style={{ ...style, display: "flex", justifyContent: "center", alignItems: "center" , background: "#D5EFFA", padding: "28px", borderRadius: "30px", border: "1px solid #1A21BC" }}
            onClick={onClick}
        />
    );
}

export default class JobOffers extends Component {

    render() {
        const settings = {
            dots: false,
            infinite: true,
            slidesToShow: 3,
            slidesToScroll: 1,
            arrows: false,
            autoplay: false,
            speed: 4000,
            nextArrow: <SampleNextArrow className={undefined} style={undefined} onClick={undefined} />,
            prevArrow: <SamplePrevArrow className={undefined} style={undefined} onClick={undefined} />,
            autoplaySpeed: 4500,
            cssEase: "linear",
            responsive: [
                {
                    breakpoint: 1200,
                    settings: {
                        slidesToShow: 3,
                        slidesToScroll: 1,
                        infinite: true,
                        dots: false
                    }
                },
                {
                    breakpoint: 1000,
                    settings: {
                        slidesToShow: 2,
                        slidesToScroll: 1,
                        infinite: true,
                        dots: false
                    }
                },
                {
                    breakpoint: 530,
                    settings: {
                        slidesToShow: 1,
                        slidesToScroll: 1,
                        infinite: true,
                        dots: false
                    }
                }
            ]
        };

        return (
            <div className="py-10 sm:py-24 bg-paleblue" id="jobs">

                <div className='mx-auto max-w-2xl lg:max-w-7xl sm:py-4 px-4 lg:px-8 relative'>
                    <h2 className="lh-82 text-midnightblue text-4xl md:text-55xl text-center md:text-start font-semibold">Explore our <br /> job offers.</h2>

                    <Slider {...settings}>
                        {jobData.map((job, i) => (
                            <div key={i}>
                                <div className='m-3 py-14 md:my-10 text-center'>
                                    <div className="relative flex justify-center items-center">
                                        <div className="w-24 h-24 overflow-hidden rounded-full">
                                            <Image src={job.imgSrc} alt="job-image" width={96} height={96} className="object-cover" />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <h3 className='text-2xl font-semibold text-lightblack'>{job.title}</h3>
                                        <h4 className='text-lg font-normal text-lightblack pt-2 opacity-50'>{job.company}</h4>
                                        <p className='text-md font-normal text-lightblack pt-1 opacity-75'>{job.location}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Slider>

                </div>
            </div>

        );
    }
}
