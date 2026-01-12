# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Community Movies is a bilingual (Dutch/English) website for free outdoor movie screenings in the park. We don't have funding so we want to keep hosting free - planning to deploy to netlify. 

The site is designed for easy content management by non-technical users.

Use SummerMoviesInthePark website as reference - https://www.summermoviesinthepark.com/

/existing-content has pictures and docs you should review about our project


## Managing content:

Movie screening should have these properties:

Movie Title:
Movie Description:
Rating:
Date:
Time:
Preview URL (for embedding a preview from youtube): 


Let's use Google Sheets as a "CMS" so anyone with access to the Google Sheets can manage content

Movie schedule lives in a shared Google Sheet
Site fetches data from the sheet using the Sheets API (free)
Anyone with sheet access can update the schedule
Weather can be pulled from a free API like Open-Meteo


## 

