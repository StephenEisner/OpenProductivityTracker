# BIG TODO 
## MAke sure the Rust Core and the CLI are going to get properly integrated. These are probably going to be needed to connect across apps.
## Think about how we are going to securely get everything across apps. Also, think about how we are going to properly

# FreeList

Cross-platform FOSS ecosystem for task + grocery + health tracking. The ultimate productivity ecosystem. 
Features, Habit Tracking, Scheduling, Improve Efficiency and learn how long you take to do things. 
Find out what you are doing with your life. Keep track of what you eat, what you do, what you have, how you feel. 


Apps: 
OpenTaskTracker
OpenNutrition
OpenFitness
OpenCooking
OpenStorageTracker

- `frontend/`: React Native (iOS, Android, macOS, web)
- `core/`: Shared Rust logic for tasks, food, syncing
- `cli/`: Optional CLI interface for power users





Ok, just so you know, those features about calculating time I have not added yet. We can work on those more later, but for now, I think we need to get some more basic stuff going. So, one of those things is we need a page for completed tasks. Once something is completed it needs to go there. Then we can undo that if need be. We want to be able to delete completed tasks and regular tasks too. This includes deleting them from the database. For the purpose of testing, how do I clear the database on my phone? Then we can start working on our tag system later.



I want the app to work with multiple operating systems. I am also thinking that perhaps we will eventually make it connect to apps like GoodReads and Letterboxd. Also, Duolingo, and any apps that the fitness and nutrition apps work with. I will want the nutrition app to perhaps also have a cooking app associated, which will connect well with the FreeList app. 

I want the cooking and list app to allow you to quickly create a grocery list. Perhaps we should also have an app that keeps track of what you have in your fridge, so the grocery list is appropriately calculated. If you are really honest with yourself, and track everything you eat, then the system will know exactly what you have in your fridge and if you have enough. 


So, we want the OpenStorageTracker when you say you ran out of something to ask, do you want me to add this to your groccery list. This then gets added as a task tagged as grocceries.
Or, OpenCooking says, do you want to add everything you don't have into a groccery list. This checks your openstoragetracker, and adds everything you don't have, asking about the things you are running low on or might be getting old.


